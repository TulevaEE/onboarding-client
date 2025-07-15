import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import './Payment.scss';
import { AvailablePaymentType, BankKey } from './types';

type Props = {
  paymentBank: BankKey | 'other' | null;
  paymentType: AvailablePaymentType;
  handleSubmit: () => unknown;
  disabled: boolean;
};
export const PaymentSubmitSection = ({
  paymentBank,
  paymentType,
  handleSubmit,
  disabled,
}: Props) => {
  if (paymentBank === 'other') {
    return (
      <div className="mt-5 d-flex gap-2 align-items-center">
        <span>
          {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.paymentQuestion" />}
          {paymentType === 'RECURRING' && (
            <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
          )}
        </span>
        <Link className="icon-link" to="/account">
          <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="mt-5 d-flex flex-column">
        <div className="me-auto text-body-secondary">
          <button
            type="button"
            className="btn btn-lg btn-primary payment-button text-nowrap"
            disabled={disabled}
            onClick={handleSubmit}
          >
            {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.makePayment" />}
            {paymentType === 'RECURRING' && (
              <FormattedMessage id="thirdPillarPayment.setupRecurringPayment" />
            )}
          </button>
          {paymentType === 'SINGLE' && (
            <>
              <p className="m-0 mt-3">
                <FormattedMessage
                  id="thirdPillarPayment.freeSinglePayment"
                  values={{
                    b: (chunks: string) => <b>{chunks}</b>,
                  }}
                />
              </p>
              <p className="m-0">
                <FormattedMessage id="thirdPillarPayment.singlePaymentDetails" />
              </p>
            </>
          )}
          {paymentType === 'RECURRING' && (
            <>
              <p className="m-0 mt-3">
                <FormattedMessage
                  id="thirdPillarPayment.freeRecurringPayment"
                  values={{
                    b: (chunks: string) => <b>{chunks}</b>,
                  }}
                />
              </p>
              <p className="m-0">
                <FormattedMessage id="thirdPillarPayment.recurringPaymentDetails" />
              </p>
            </>
          )}
        </div>
        {paymentType === 'RECURRING' && !disabled && (
          <div className="mt-5 d-flex gap-2 align-items-center">
            <span>
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            </span>
            <a className="icon-link" href="/account">
              <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
            </a>
          </div>
        )}
      </div>
    </>
  );
};
