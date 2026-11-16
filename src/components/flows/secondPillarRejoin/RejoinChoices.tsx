import { ReactNode, useRef, useState } from 'react';
import { FormatNumberOptions, FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../common';
import { Recommended } from '../../common/Recommended';
import { Fees } from '../../common/Percentage/Fees';
import { Fund } from '../../common/apiModels';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { TranslationKey } from '../../translations';
import {
  compareFirstPillarWithSecond,
  FirstPillarComparison,
  PENSION_UNIT_VALUE,
} from './firstPillarComparison';
import styles from './RejoinChoices.module.scss';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const ChoiceSection = ({
  id,
  label,
  children,
}: {
  id: string;
  label: ReactNode;
  children: ReactNode;
}) => (
  <div role="group" aria-labelledby={`${id}-label`}>
    <div id={`${id}-label`} className="fw-semibold mb-2">
      {label}
    </div>
    <div className="d-flex flex-column gap-2">{children}</div>
  </div>
);

export const PAYMENT_RATES: PaymentRate[] = [6, 4, 2];
const RECOMMENDED_PAYMENT_RATE: PaymentRate = 6;

export type TaxWinExplanation = 'greatestOnRecommendedRate' | 'comparedWithLowestRate';

const MutedLine = ({ id }: { id: TranslationKey }) => (
  <p className="m-0 text-body-secondary">
    <FormattedMessage id={id} />
  </p>
);

const TaxWinNote = ({
  rate,
  explanation,
}: {
  rate: PaymentRate;
  explanation: TaxWinExplanation;
}) => {
  if (explanation === 'comparedWithLowestRate') {
    return <MutedLine id={`secondPillarRejoin.paymentRate.taxWinComparison.${rate}Percent`} />;
  }
  return rate === RECOMMENDED_PAYMENT_RATE ? (
    <MutedLine id="secondPillarPaymentRate.maximumBenefit" />
  ) : null;
};

export const PaymentRateChoice = ({
  paymentRate,
  taxWinExplanation,
  onChange,
}: {
  paymentRate: PaymentRate;
  taxWinExplanation: TaxWinExplanation;
  onChange: (paymentRate: PaymentRate) => void;
}) => (
  <ChoiceSection
    id="rejoin-payment-rate"
    label={<FormattedMessage id="secondPillarRejoin.paymentRate.label" />}
  >
    {PAYMENT_RATES.map((rate) => (
      <Radio
        key={rate}
        name="rejoin-payment-rate"
        id={`rejoin-payment-rate-${rate}`}
        selected={rate === paymentRate}
        onSelect={() => onChange(rate)}
      >
        <p className="mb-1">
          <span className="fw-medium me-2">
            <FormattedMessage id={`secondPillarPaymentRate.option.${rate}Percent`} />
          </span>
          {rate === RECOMMENDED_PAYMENT_RATE && <Recommended />}
        </p>
        <p className="m-0 text-body-secondary">
          <FormattedMessage
            id={`secondPillarRejoin.paymentRate.stateAddsTotal.${rate}Percent`}
            values={{ b: bold }}
          />
        </p>
        <TaxWinNote rate={rate} explanation={taxWinExplanation} />
      </Radio>
    ))}
    <PaymentRateNotes paymentRate={paymentRate} />
  </ChoiceSection>
);

const Unfolding = ({
  open,
  quick = false,
  children,
}: {
  open: boolean;
  quick?: boolean;
  children: ReactNode;
}) => {
  const [wasOpen, setWasOpen] = useState(open);
  const [isFolding, setFolding] = useState(false);
  const childrenWhileOpen = useRef(children);
  if (open !== wasOpen) {
    setWasOpen(open);
    setFolding(!open);
  }
  if (open) {
    childrenWhileOpen.current = children;
  }

  if (!open && !isFolding) {
    return null;
  }
  return (
    <div
      className={`${isFolding ? styles.fold : styles.unfold} ${quick ? styles.quick : ''}`}
      aria-hidden={isFolding || undefined}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setFolding(false);
        }
      }}
    >
      <div className={styles.unfoldContent}>{childrenWhileOpen.current}</div>
    </div>
  );
};

const EXAMPLE_GROSS_SALARY = 2000;
const FIRST_PILLAR_EFFECT_ID = 'rejoin-first-pillar-effect';
const FIRST_PILLAR_COMPARISON_ID = 'rejoin-first-pillar-comparison';
const CALCULATION_ID = 'rejoin-first-pillar-calculation';
const INLINE_TOGGLE =
  'btn-link link-secondary text-decoration-underline bg-transparent border-0 p-0 align-baseline text-start user-select-auto';

const useEuros = () => {
  const { formatNumber } = useIntl();
  return (amount: number, options?: FormatNumberOptions) =>
    `${formatNumber(amount, options)}\u00A0€`;
};

const PillarColumn = ({
  className,
  name,
  nature,
  amount,
  per,
}: {
  className: string;
  name: TranslationKey;
  nature: TranslationKey;
  amount: string;
  per: TranslationKey;
}) => (
  <div className={`col-6 px-2 px-sm-3 ${className}`}>
    <p className="fw-semibold mb-0">
      <FormattedMessage id={name} />
    </p>
    <p className="mb-2">
      <FormattedMessage id={nature} />
    </p>
    <p className="fs-3 fw-bold lh-sm mb-1">+{amount}</p>
    <p className="m-0 text-pretty">
      <FormattedMessage id={per} />
    </p>
  </div>
);

const FirstPillarCalculation = ({
  paymentRate,
  comparison,
}: {
  paymentRate: PaymentRate;
  comparison: FirstPillarComparison;
}) => {
  const { formatNumber } = useIntl();
  const euros = useEuros();
  const secondPillarYearly = Math.round(comparison.secondPillarYearly);
  const socialTaxYearly = Math.round(comparison.socialTaxYearly);

  return (
    <div id={CALCULATION_ID} className="border-top mt-3 pt-3 small text-body-secondary text-pretty">
      <p>
        <FormattedMessage
          id="secondPillarRejoin.firstPillarComparison.calculation.firstPillar"
          values={{
            b: bold,
            firstPillarMonthly: euros(Math.round(comparison.firstPillarMonthly)),
            unitsLost: formatNumber(comparison.firstPillarUnitsLost, {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }),
            firstPillarMonthlyExact: euros(comparison.firstPillarMonthly, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            pensionUnitValue: euros(PENSION_UNIT_VALUE),
            firstPillarOverRetirement: euros(Math.round(comparison.firstPillarOverRetirement)),
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="secondPillarRejoin.firstPillarComparison.calculation.secondPillar"
          values={{
            b: bold,
            secondPillarYearly: euros(secondPillarYearly),
            socialTaxYearly: euros(socialTaxYearly),
            incomeTaxYearly: euros(secondPillarYearly - socialTaxYearly),
            rate: paymentRate,
            timesFirstPillar: Math.round(
              comparison.secondPillarYearly / comparison.firstPillarOverRetirement,
            ),
          }}
        />
      </p>
      <p className="mb-0">
        <FormattedMessage id="secondPillarRejoin.firstPillarComparison.calculation.risks" />
      </p>
    </div>
  );
};

const FirstPillarComparisonCards = ({ paymentRate }: { paymentRate: PaymentRate }) => {
  const euros = useEuros();
  const [isCalculationOpen, setCalculationOpen] = useState(false);
  const comparison = compareFirstPillarWithSecond(EXAMPLE_GROSS_SALARY, paymentRate);
  const { firstPillarMonthly, secondPillarYearly } = comparison;

  return (
    <div
      id={FIRST_PILLAR_COMPARISON_ID}
      role="region"
      aria-labelledby={FIRST_PILLAR_EFFECT_ID}
      className="bg-gray-2 rounded-4 p-3 p-sm-4 mt-2"
    >
      <div className="row g-0 position-relative text-center">
        <PillarColumn
          className="text-body-secondary"
          name="secondPillarRejoin.firstPillarComparison.firstPillar"
          nature="secondPillarRejoin.firstPillarComparison.firstPillar.nature"
          amount={euros(Math.round(firstPillarMonthly))}
          per="secondPillarRejoin.firstPillarComparison.firstPillar.amount"
        />
        <span className="badge rounded-pill bg-body text-body border fw-normal position-absolute top-50 start-50 translate-middle w-auto z-1">
          <FormattedMessage id="secondPillarRejoin.firstPillarComparison.or" />
        </span>
        <PillarColumn
          className="text-success border-start"
          name="secondPillarRejoin.firstPillarComparison.secondPillar"
          nature="secondPillarRejoin.firstPillarComparison.secondPillar.nature"
          amount={euros(Math.round(secondPillarYearly))}
          per="secondPillarRejoin.firstPillarComparison.secondPillar.amount"
        />
      </div>
      <p className="mt-4 mb-0 small text-body-secondary text-balance text-center">
        <FormattedMessage
          id="secondPillarRejoin.firstPillarComparison.caption"
          values={{ salary: euros(EXAMPLE_GROSS_SALARY), rate: paymentRate }}
        />{' '}
        <button
          type="button"
          className={`${INLINE_TOGGLE} text-nowrap`}
          aria-expanded={isCalculationOpen}
          aria-controls={CALCULATION_ID}
          onClick={() => setCalculationOpen(!isCalculationOpen)}
        >
          <FormattedMessage id="secondPillarRejoin.firstPillarComparison.calculation" />
        </button>
      </p>
      <Unfolding open={isCalculationOpen}>
        <FirstPillarCalculation paymentRate={paymentRate} comparison={comparison} />
      </Unfolding>
    </div>
  );
};

const PaymentRateNotes = ({ paymentRate }: { paymentRate: PaymentRate }) => {
  const [isComparisonOpen, setComparisonOpen] = useState(false);

  return (
    <div>
      <p className="m-0 text-body-secondary">
        <FormattedMessage
          id="secondPillarRejoin.paymentRate.notes"
          values={{
            button: (chunks: ReactNode) => (
              <button
                type="button"
                id={FIRST_PILLAR_EFFECT_ID}
                className={INLINE_TOGGLE}
                aria-expanded={isComparisonOpen}
                aria-controls={FIRST_PILLAR_COMPARISON_ID}
                onClick={() => setComparisonOpen(!isComparisonOpen)}
              >
                {chunks}
              </button>
            ),
          }}
        />
      </p>
      <Unfolding open={isComparisonOpen}>
        <FirstPillarComparisonCards paymentRate={paymentRate} />
      </Unfolding>
    </div>
  );
};

const byName = (first: Fund, second: Fund) =>
  first.name.localeCompare(second.name, 'et', { sensitivity: 'base' });

const FundOptions = ({ funds }: { funds: Fund[] }) => (
  <>
    {[...funds].sort(byName).map((fund) => (
      <option key={fund.isin} value={fund.isin}>
        {fund.name}
      </option>
    ))}
  </>
);

const FundFees = ({ fund }: { fund: Fund }) => (
  <p className="m-0 text-body-secondary">
    <FormattedMessage id="target.funds.fees" />{' '}
    <Fees value={fund.ongoingChargesFigure} showPerYear />
  </p>
);

export type FundPick = { isin: string | null; isFromList: boolean };

type FundChoiceProps = {
  funds: Fund[];
  recommendedFundIsin: string;
  pick: FundPick;
  onChange: (pick: FundPick) => void;
};

export const FundChoice = ({ funds, recommendedFundIsin, pick, onChange }: FundChoiceProps) => {
  const { formatMessage } = useIntl();
  const recommendedFund = funds.find((fund) => fund.isin === recommendedFundIsin);
  const listedFund = pick.isFromList ? funds.find((fund) => fund.isin === pick.isin) : undefined;

  return (
    <ChoiceSection id="rejoin-fund" label={<FormattedMessage id="secondPillarRejoin.fund.label" />}>
      {recommendedFund && (
        <Radio
          name="rejoin-fund"
          id={`rejoin-fund-${recommendedFund.isin}`}
          selected={!pick.isFromList}
          onSelect={() => onChange({ isin: recommendedFund.isin, isFromList: false })}
        >
          <p className="mb-1 fw-medium">{recommendedFund.name}</p>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="secondPillarRejoin.fund.recommended.description" />
          </p>
          <FundFees fund={recommendedFund} />
        </Radio>
      )}
      <Radio
        name="rejoin-fund"
        id="rejoin-fund-another"
        selected={pick.isFromList}
        onSelect={() => onChange({ isin: null, isFromList: true })}
      >
        <p className="m-0 fw-medium">
          <FormattedMessage id="secondPillarRejoin.fund.other" />
        </p>
        <Unfolding open={pick.isFromList}>
          <select
            aria-label={formatMessage({ id: 'transfer.future.capital.other.fund' })}
            className="form-select my-2"
            value={listedFund?.isin ?? ''}
            onChange={(event) => onChange({ isin: event.target.value, isFromList: true })}
          >
            <FormattedMessage id="transfer.future.capital.other.fund">
              {(message) => (
                <option value="" hidden>
                  {message}
                </option>
              )}
            </FormattedMessage>
            <FundOptions funds={funds} />
          </select>
        </Unfolding>
        <Unfolding open={listedFund !== undefined} quick>
          {listedFund && <FundFees fund={listedFund} />}
        </Unfolding>
      </Radio>
      <MutedLine id="secondPillarRejoin.fund.changeAnyTime" />
    </ChoiceSection>
  );
};
