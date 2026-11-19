import React, { ReactNode, RefObject, useState } from 'react';
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
  onCorrect: (month: string, amount: number) => void;
  correctionFailed: boolean;
  expectedIncomeInput: RefObject<HTMLInputElement>;
  className?: string;
};

const MONTHLY_INCOME_MAX_DIGITS = 5;

const expectedIncomeNoteIdOf = (headroom: ThirdPillarTaxHeadroom): TranslationKey => {
  if (headroom.expectedIncomeBasis === 'NO_DATA') {
    return 'thirdPillarTaxHeadroom.breakdown.expectedIncome.noDataNote';
  }
  if (headroom.expectedIncomeBasis === 'LAST_YEAR' || !headroom.incomeKnownThrough) {
    return 'thirdPillarTaxHeadroom.breakdown.expectedIncome.lastYearNote';
  }
  return 'thirdPillarTaxHeadroom.breakdown.expectedIncome.recentMonthsNote';
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

const ExpectedMonthInput = ({
  expected,
  label,
  inputRef,
  onCorrect,
}: {
  expected: ExpectedMonthlyIncome;
  label: ReactNode;
  inputRef?: RefObject<HTMLInputElement>;
  onCorrect: (month: string, amount: number) => void;
}) => {
  const [value, setValue] = useState(String(Math.floor(expected.amount)));
  const id = `expected-income-${expected.month}`;

  return (
    <tr>
      <td className="ps-3 align-middle">
        <label htmlFor={id} className="mb-0">
          {label}
        </label>
      </td>
      <td className="text-end">
        <div className={`input-group ms-auto ${styles.expectedIncome}`}>
          <input
            id={id}
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="form-control text-end"
            value={value}
            onChange={(event) => {
              const digits = event.target.value
                .replace(/\D/g, '')
                .slice(0, MONTHLY_INCOME_MAX_DIGITS);
              setValue(digits);
              if (digits !== '') {
                onCorrect(expected.month, Number(digits));
              }
            }}
          />
          <span className="input-group-text">&euro;</span>
        </div>
      </td>
    </tr>
  );
};

export const TaxHeadroomBreakdown = ({
  headroom,
  figures,
  open,
  onToggle,
  onCorrect,
  correctionFailed,
  expectedIncomeInput,
  className = '',
}: Props) => {
  const { formatDate } = useIntl();
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
            <BreakdownRow
              label={<FormattedMessage id="thirdPillarTaxHeadroom.breakdown.expectedIncome" />}
              note={<FormattedMessage id={expectedIncomeNoteIdOf(headroom)} />}
              amount={<WholeEuro amount={figures.expectedIncome} />}
            />
          )}
          {headroom.expectedIncome.map((expected, index) => (
            <ExpectedMonthInput
              key={expected.month}
              expected={expected}
              inputRef={index === 0 ? expectedIncomeInput : undefined}
              onCorrect={onCorrect}
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
