import React, { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Euro } from '../../common/Euro';
import { PhosphorIcon } from '../../common/PhosphorIcon';
import { ExpectedMonthlyIncome, ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';
import { TranslationKey } from '../../translations';
import { HeadroomFigures, monthNumberOf } from './headroomFigures';
import styles from './TaxHeadroomBreakdown.module.scss';

type Props = {
  headroom: ThirdPillarTaxHeadroom;
  figures: HeadroomFigures;
  open: boolean;
  onToggle: (open: boolean) => void;
  onCorrectMonth: (month: string, amount: number | null) => void;
  onCorrectYear: (amount: number | null) => void;
  correctionFailed: boolean;
  yearlyIncomeInput: RefObject<HTMLInputElement>;
  className?: string;
};

const MONTHLY_INCOME_MAX_DIGITS = 5;
const LARGEST_EXPECTED_MONTHLY_INCOME = 100000;
const YEARLY_INCOME_MAX_DIGITS = 7;
const YEARLY_INCOME_ID = 'yearly-income';
const YEARLY_INCOME_HELP_ID = 'yearly-income-help';
const EXPECTED_MONTHS_ID = 'expected-income-months';

const yearlyIncomeNoteIdOf = (
  headroom: ThirdPillarTaxHeadroom,
  figures: HeadroomFigures,
): TranslationKey | null => {
  if (headroom.expectedIncomeBasis === 'NO_DATA') {
    return 'thirdPillarTaxHeadroom.breakdown.yearlyIncome.noDataNote';
  }
  if (figures.expectedIncomeIsOwn) {
    return null;
  }
  if (headroom.expectedIncomeBasis === 'LAST_YEAR' || !headroom.incomeKnownThrough) {
    return 'thirdPillarTaxHeadroom.breakdown.yearlyIncome.lastYearNote';
  }
  return 'thirdPillarTaxHeadroom.breakdown.yearlyIncome.recentMonthsNote';
};

const WholeEuro = ({ amount }: { amount: number }) => (
  <Euro amount={Math.floor(amount)} fractionDigits={0} />
);

const BreakdownRow = ({
  label,
  note,
  amount,
}: {
  label: ReactNode;
  note?: ReactNode;
  amount: ReactNode;
}) => (
  <tr>
    <td>
      {label}
      {note && <div className="text-body-secondary">{note}</div>}
    </td>
    <td className="text-end align-top text-nowrap">{amount}</td>
  </tr>
);

const AmountInput = ({
  id,
  amount,
  minimum = 0,
  maximum = Infinity,
  maxDigits,
  onChange,
  inputRef,
  describedBy,
}: {
  id: string;
  amount: number;
  minimum?: number;
  maximum?: number;
  maxDigits: number;
  onChange: (amount: number | null) => void;
  inputRef?: RefObject<HTMLInputElement>;
  describedBy?: string;
}) => {
  const saved = String(Math.floor(amount));
  const [value, setValue] = useState(saved);
  const focused = useRef(false);
  const edited = useRef(false);
  const accepts = (digits: string) =>
    digits !== '' && Number(digits) >= minimum && Number(digits) <= maximum;

  useEffect(() => {
    if (!focused.current) {
      setValue(saved);
    }
  }, [saved]);

  return (
    <div className={`input-group ms-auto ${styles.amount}`}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="form-control text-end"
        aria-describedby={describedBy}
        value={value}
        onFocus={() => {
          focused.current = true;
          edited.current = false;
        }}
        onBlur={() => {
          focused.current = false;
          if (!edited.current || !accepts(value)) {
            setValue(saved);
          }
        }}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/\D/g, '')
            .replace(/^0+(?=\d)/, '')
            .slice(0, maxDigits);
          edited.current = true;
          setValue(digits);
          onChange(accepts(digits) ? Number(digits) : null);
        }}
      />
      <span className="input-group-text">&euro;</span>
    </div>
  );
};

const ExpectedMonthRow = ({
  expected,
  label,
  onCorrect,
}: {
  expected: ExpectedMonthlyIncome;
  label: ReactNode;
  onCorrect: (month: string, amount: number | null) => void;
}) => {
  const id = `expected-income-${expected.month}`;

  return (
    <tr>
      <td className="ps-3 align-middle">
        <label htmlFor={id} className="mb-0">
          {label}
        </label>
      </td>
      <td className="text-end">
        <AmountInput
          id={id}
          amount={expected.amount}
          maxDigits={MONTHLY_INCOME_MAX_DIGITS}
          onChange={(amount) => onCorrect(expected.month, amount)}
        />
      </td>
    </tr>
  );
};

export const TaxHeadroomBreakdown = ({
  headroom,
  figures,
  open,
  onToggle,
  onCorrectMonth,
  onCorrectYear,
  correctionFailed,
  yearlyIncomeInput,
  className = '',
}: Props) => {
  const { formatDate } = useIntl();
  const [monthsOpen, setMonthsOpen] = useState(false);
  const yearlyIncomeNote = yearlyIncomeNoteIdOf(headroom, figures);
  const monthName = (month: number) =>
    formatDate(new Date(headroom.year, month - 1, 1), { month: 'long' });
  const lastKnownMonth = headroom.incomeKnownThrough
    ? monthNumberOf(headroom.incomeKnownThrough)
    : null;

  return (
    <details
      className={`${styles.breakdown} ${className}`}
      open={open}
      onToggle={(event) => onToggle(event.currentTarget.open)}
    >
      <summary>
        <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.title" />
        <PhosphorIcon name="caretDown" size={14} />
      </summary>
      <table className="table mt-2 mb-0">
        <tbody>
          {lastKnownMonth && headroom.knownIncome > 0 && (
            <BreakdownRow
              label={
                <FormattedMessage
                  id="thirdPillarTaxHeadroom.breakdown.incomeSoFar"
                  values={{ from: monthName(1), through: monthName(lastKnownMonth) }}
                />
              }
              note={<FormattedMessage id="thirdPillarTaxHeadroom.breakdown.incomeSoFar.source" />}
              amount={<WholeEuro amount={headroom.knownIncome} />}
            />
          )}
          {headroom.expectedIncome.length > 0 && (
            <tr>
              <td colSpan={2}>
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <label htmlFor={YEARLY_INCOME_ID} className="mb-0">
                    <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.yearlyIncome" />
                  </label>
                  <AmountInput
                    id={YEARLY_INCOME_ID}
                    inputRef={yearlyIncomeInput}
                    amount={figures.yearlyIncome}
                    minimum={Math.ceil(headroom.knownIncome)}
                    maximum={Math.floor(
                      headroom.knownIncome +
                        LARGEST_EXPECTED_MONTHLY_INCOME * headroom.expectedIncome.length,
                    )}
                    maxDigits={YEARLY_INCOME_MAX_DIGITS}
                    describedBy={YEARLY_INCOME_HELP_ID}
                    onChange={onCorrectYear}
                  />
                </div>
                <p id={YEARLY_INCOME_HELP_ID} className="text-body-secondary mt-2 mb-0">
                  {yearlyIncomeNote && (
                    <>
                      <FormattedMessage id={yearlyIncomeNote} />{' '}
                    </>
                  )}
                  <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.yearlyIncome.otherIncome" />{' '}
                  <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.yearlyIncome.thisYear" />
                </p>
                <button
                  type="button"
                  className={`btn btn-link p-0 ${styles.byMonth}`}
                  aria-expanded={monthsOpen}
                  aria-controls={EXPECTED_MONTHS_ID}
                  onClick={() => setMonthsOpen(!monthsOpen)}
                >
                  <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.byMonth" />
                  <PhosphorIcon name="caretDown" size={14} />
                </button>
              </td>
            </tr>
          )}
        </tbody>
        {monthsOpen && (
          <tbody id={EXPECTED_MONTHS_ID}>
            {headroom.expectedIncome.map((expected) => (
              <ExpectedMonthRow
                key={expected.month}
                expected={expected}
                onCorrect={onCorrectMonth}
                label={
                  <>
                    <span className="visually-hidden">
                      <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.expectedIncome" />{' '}
                    </span>
                    <span className="text-capitalize">
                      {monthName(monthNumberOf(expected.month))}
                    </span>
                  </>
                }
              />
            ))}
          </tbody>
        )}
        <tbody>
          <BreakdownRow
            label={<FormattedMessage id="thirdPillarTaxHeadroom.breakdown.limit" />}
            note={<FormattedMessage id="thirdPillarTaxHeadroom.breakdown.limit.note" />}
            amount={
              <>
                {figures.limitIsEstimate && '~'}
                <WholeEuro amount={figures.limit} />
              </>
            }
          />
          <BreakdownRow
            label={<FormattedMessage id="thirdPillarTaxHeadroom.breakdown.paid" />}
            amount={<WholeEuro amount={-Math.floor(headroom.paid)} />}
          />
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="fw-medium">
              <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.remaining" />
            </th>
            <td className="text-end fw-medium text-nowrap border-bottom-0">
              <WholeEuro amount={figures.remaining} />
            </td>
          </tr>
        </tfoot>
      </table>
      {correctionFailed && (
        <p className="text-danger mt-2 mb-0" role="alert">
          <FormattedMessage id="thirdPillarTaxHeadroom.breakdown.saveFailed" />
        </p>
      )}
    </details>
  );
};
