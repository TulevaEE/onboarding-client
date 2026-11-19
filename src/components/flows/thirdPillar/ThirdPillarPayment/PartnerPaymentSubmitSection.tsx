import { FormattedMessage } from 'react-intl';
import { AvailablePaymentType } from './types';

type Props = {
  paymentType: AvailablePaymentType;
  handleSubmit: () => unknown;
  disabled: boolean;
};

export const PartnerPaymentSubmitSection = ({ paymentType, handleSubmit, disabled }: Props) => (
  <div className="mt-5">
    <button
      type="button"
      className="btn btn-lg btn-primary payment-button text-nowrap"
      disabled={disabled}
      onClick={handleSubmit}
    >
      {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.makePayment" />}
      {paymentType === 'RECURRING' && (
        <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />
      )}
    </button>
    <p className="m-0 mt-3 text-body-secondary text-pretty">
      <FormattedMessage id="thirdPillarBackToPartner.payment.subtitle" />
    </p>
  </div>
);
