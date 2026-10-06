import { ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Radio } from '../../common';
import { Recommended } from '../../common/Recommended';
import { Fees } from '../../common/Percentage/Fees';
import { Fund } from '../../common/apiModels';
import { PaymentRate } from '../secondPillarPaymentRate/types';

type ChoiceRowProps = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const ChoiceRow = ({ id, label, value, open, onToggle, children }: ChoiceRowProps) => (
  <div role="group" aria-labelledby={`${id}-label`} className="py-3 border-bottom">
    <div className="d-flex justify-content-between align-items-start gap-3">
      <div>
        <div id={`${id}-label`} className="small text-body-secondary">
          {label}
        </div>
        <div className="fw-medium">{value}</div>
      </div>
      <button
        type="button"
        className="btn btn-link p-0 text-end"
        style={{ minWidth: '4.5rem' }}
        aria-expanded={open}
        onClick={onToggle}
      >
        <FormattedMessage id={open ? 'secondPillarRejoin.done' : 'secondPillarRejoin.change'} />
      </button>
    </div>
    {open && <div className="d-flex flex-column gap-2 mt-3">{children}</div>}
  </div>
);

export const PAYMENT_RATES: PaymentRate[] = [2, 4, 6];
const RECOMMENDED_PAYMENT_RATE: PaymentRate = 6;

export const PaymentRateChoice = ({
  paymentRate,
  onChange,
  open,
  onToggle,
}: {
  paymentRate: PaymentRate;
  onChange: (paymentRate: PaymentRate) => void;
  open: boolean;
  onToggle: () => void;
}) => (
  <ChoiceRow
    id="rejoin-payment-rate"
    label={<FormattedMessage id="secondPillarRejoin.paymentRate.label" />}
    value={
      <FormattedMessage id="secondPillarRejoin.paymentRate.value" values={{ rate: paymentRate }} />
    }
    open={open}
    onToggle={onToggle}
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
        <p className="m-0 small text-body-secondary">
          <FormattedMessage
            id={`secondPillarPaymentRate.calculation.${rate}Percent`}
            values={{ b: (chunks: string) => <b>{chunks}</b> }}
          />
        </p>
        {rate === RECOMMENDED_PAYMENT_RATE && (
          <p className="m-0 small text-body-secondary">
            <FormattedMessage id="secondPillarPaymentRate.maximumBenefit" />
          </p>
        )}
      </Radio>
    ))}
  </ChoiceRow>
);

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

type FundChoiceProps = {
  funds: Fund[];
  recommendedFundIsin: string;
  fundIsin: string;
  onChange: (fundIsin: string) => void;
  open: boolean;
  onToggle: () => void;
};

export const FundChoice = ({
  funds,
  recommendedFundIsin,
  fundIsin,
  onChange,
  open,
  onToggle,
}: FundChoiceProps) => {
  const { formatMessage } = useIntl();
  const [isPickingAnotherFund, setPickingAnotherFund] = useState(false);
  const recommendedFund = funds.find((fund) => fund.isin === recommendedFundIsin);
  const chosenFund = funds.find((fund) => fund.isin === fundIsin);
  const isAnotherFundChosen = fundIsin !== recommendedFundIsin;
  const isAnotherFundSelected = isPickingAnotherFund || isAnotherFundChosen;

  const choose = (isin: string) => {
    setPickingAnotherFund(false);
    onChange(isin);
  };

  return (
    <ChoiceRow
      id="rejoin-fund"
      label={<FormattedMessage id="secondPillarRejoin.fund.label" />}
      value={
        chosenFund && (
          <>
            {chosenFund.name}
            <span className="d-block small fw-normal">
              <FormattedMessage id="target.funds.fees" />{' '}
              <Fees value={chosenFund.ongoingChargesFigure} showPerYear />
            </span>
          </>
        )
      }
      open={open}
      onToggle={() => {
        setPickingAnotherFund(false);
        onToggle();
      }}
    >
      {recommendedFund && (
        <Radio
          name="rejoin-fund"
          id={`rejoin-fund-${recommendedFund.isin}`}
          selected={!isAnotherFundSelected}
          onSelect={() => choose(recommendedFund.isin)}
        >
          <p className="mb-1 fw-medium">{recommendedFund.name}</p>
          <p className="m-0 small text-body-secondary">
            <FormattedMessage id="secondPillarRejoin.fund.recommended.description" />
          </p>
          <p className="m-0 small text-body-secondary">
            <FormattedMessage id="target.funds.fees" />{' '}
            <Fees value={recommendedFund.ongoingChargesFigure} showPerYear />
          </p>
        </Radio>
      )}
      <Radio
        name="rejoin-fund"
        id="rejoin-fund-another"
        selected={isAnotherFundSelected}
        onSelect={() => setPickingAnotherFund(true)}
      >
        <FormattedMessage id="secondPillarRejoin.fund.other" />
      </Radio>
      {isAnotherFundSelected && (
        <select
          aria-label={formatMessage({ id: 'transfer.future.capital.other.fund' })}
          className="form-select"
          value={isAnotherFundChosen ? fundIsin : ''}
          onChange={(event) => choose(event.target.value)}
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
      )}
    </ChoiceRow>
  );
};
