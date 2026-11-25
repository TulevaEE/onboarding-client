import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import './Payment.scss';
import { AvailablePaymentType, BankKey, hasStandingOrderLink } from './types';

type Props = {
  paymentBank: BankKey | 'other' | null;
  paymentType: AvailablePaymentType;
  handleSubmit: () => unknown;
  disabled: boolean;
};

const PAID_IN_OWN_BANK_PATH: Record<AvailablePaymentType, string> = {
  SINGLE: '/3rd-pillar-success',
  RECURRING: '/3rd-pillar-recurring-success',
};

export const PaymentSubmitSection = ({
  paymentBank,
  paymentType,
  handleSubmit,
  disabled,
}: Props) => {
  const setsUpRecurringPaymentByHand =
    paymentType === 'RECURRING' && paymentBank !== null && !hasStandingOrderLink(paymentBank);

  if (paymentBank === 'other' || setsUpRecurringPaymentByHand) {
    return (
      <div className="mt-5 d-flex gap-2 align-items-center">
        <span>
          {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.paymentQuestion" />}
          {paymentType === 'RECURRING' && (
            <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
          )}
        </span>
        <Link className="icon-link" to={PAID_IN_OWN_BANK_PATH[paymentType]}>
          <FormattedMessage id="thirdPillarPayment.confirmation.yes" />
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-5 d-flex flex-column flex-sm-row-reverse align-items-sm-start gap-3">
      <div className="flex-sm-grow-1 d-flex flex-column align-items-sm-end text-sm-end text-body-secondary">
        <button
          type="button"
          className="btn btn-lg btn-primary payment-button text-nowrap"
          disabled={disabled}
          onClick={handleSubmit}
        >
          {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.makePayment" />}
          {paymentType === 'RECURRING' && (
            <FormattedMessage
              id={
                paymentBank === 'wise'
                  ? 'thirdPillarPayment.setupRecurringPayment.wise'
                  : 'thirdPillarPayment.setupRecurringPayment'
              }
            />
          )}
        </button>
        {paymentType === 'SINGLE' && (
          <>
            <p className="m-0 mt-3 text-pretty">
              <FormattedMessage
                id="thirdPillarPayment.freeSinglePayment"
                values={{
                  b: (chunks: string) => <b>{chunks}</b>,
                }}
              />
            </p>
            <p className="m-0 text-pretty">
              <FormattedMessage id="thirdPillarPayment.singlePaymentDetails" />
            </p>
          </>
        )}
        {paymentType === 'RECURRING' && (
          <>
            <p className="m-0 mt-3 text-pretty">
              <FormattedMessage
                id="thirdPillarPayment.freeRecurringPayment"
                values={{
                  b: (chunks: string) => <b>{chunks}</b>,
                }}
              />
            </p>
            {paymentBank !== 'wise' && (
              <p className="m-0 text-pretty">
                <FormattedMessage id="thirdPillarPayment.recurringPaymentDetails" />
              </p>
            )}
          </>
        )}
        {paymentType === 'RECURRING' && !disabled && (
          <div className="mt-4 d-flex gap-2 align-items-center justify-content-sm-end text-body">
            <span>
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            </span>
            <Link className="icon-link" to={PAID_IN_OWN_BANK_PATH[paymentType]}>
              <FormattedMessage id="thirdPillarPayment.confirmation.yes" />
            </Link>
          </div>
        )}
      </div>
      <Link to="/account" className="btn btn-lg btn-outline-primary">
        <FormattedMessage id="common.back" />
      </Link>
    </div>
  );
};
