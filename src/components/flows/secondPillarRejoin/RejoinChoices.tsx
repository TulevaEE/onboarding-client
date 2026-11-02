import { ReactNode, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../common';
import { Recommended } from '../../common/Recommended';
import { Fees } from '../../common/Percentage/Fees';
import { Fund } from '../../common/apiModels';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import styles from './RejoinChoices.module.scss';

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

export const PAYMENT_RATES: PaymentRate[] = [2, 4, 6];
const RECOMMENDED_PAYMENT_RATE: PaymentRate = 6;

export const PaymentRateChoice = ({
  paymentRate,
  onChange,
}: {
  paymentRate: PaymentRate;
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
            id={`secondPillarPaymentRate.calculation.${rate}Percent`}
            values={{ b: (chunks: string) => <b>{chunks}</b> }}
          />
        </p>
        {rate === RECOMMENDED_PAYMENT_RATE && (
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="secondPillarPaymentRate.maximumBenefit" />
          </p>
        )}
      </Radio>
    ))}
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
    </ChoiceSection>
  );
};
