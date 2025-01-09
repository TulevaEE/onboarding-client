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
      <div className="mt-4">
        <Link to="/account">
          <button type="button" className="btn btn-light">
            <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
          </button>
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="d-flex flex-wrap align-items-start">
        <div className="mr-auto">
          <button
            type="button"
            className="btn btn-primary payment-button text-nowrap mt-4"
            disabled={disabled}
            onClick={handleSubmit}
          >
            {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.makePayment" />}
            {paymentType === 'RECURRING' && (
              <FormattedMessage id="thirdPillarPayment.setupRecurringPayment" />
            )}
          </button>
          <div className="mt-2">
            <small className="text-muted">
              {paymentType === 'SINGLE' && (
                <FormattedMessage
                  id="thirdPillarPayment.freeSinglePayment"
                  values={{
                    b: (chunks: string) => <b>{chunks}</b>,
                  }}
                />
              )}
              {paymentType === 'RECURRING' && (
                <FormattedMessage
                  id="thirdPillarPayment.freeRecurringPayment"
                  values={{
                    b: (chunks: string) => <b>{chunks}</b>,
                  }}
                />
              )}
            </small>
          </div>
        </div>
        {paymentType === 'RECURRING' && !disabled && (
          <div className="d-flex flex-wrap align-items-center">
            <span className="mr-2 mt-4">
              <FormattedMessage id="thirdPillarPayment.recurringPaymentQuestion" />
            </span>
            <a className="btn btn-light text-nowrap mt-4" href="/account">
              <FormattedMessage id="thirdPillarPayment.backToAccountPage" />
            </a>
          </div>
        )}
      </div>
    </>
  );
};
