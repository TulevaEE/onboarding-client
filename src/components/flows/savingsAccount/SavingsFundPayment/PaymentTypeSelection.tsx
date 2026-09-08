import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import { Recommended } from '../../../common/Recommended';

export type SavingsFundPaymentType = 'SINGLE' | 'RECURRING';

type Props = {
  paymentType: SavingsFundPaymentType;
  setPaymentType: (value: SavingsFundPaymentType) => void;
};

export const PaymentTypeSelection = ({ paymentType, setPaymentType }: Props) => (
  <div className="d-flex flex-column gap-3">
    <p id="savings-payment-type-label" className="fs-3 fw-semibold m-0">
      <FormattedMessage id="savingsFund.payment.form.paymentType.label" />
    </p>
    <div
      className="d-flex flex-column gap-2"
      role="radiogroup"
      aria-labelledby="savings-payment-type-label"
    >
      <Radio
        name="savings-payment-type"
        id="savings-payment-type-single"
        selected={paymentType === 'SINGLE'}
        onSelect={() => setPaymentType('SINGLE')}
      >
        <p className="m-0">
          <span className="fs-3 lh-sm fw-medium">
            <FormattedMessage id="savingsFund.payment.form.paymentType.single" />
          </span>
        </p>
      </Radio>
      <Radio
        name="savings-payment-type"
        id="savings-payment-type-recurring"
        selected={paymentType === 'RECURRING'}
        onSelect={() => setPaymentType('RECURRING')}
      >
        <p className="mb-1">
          <span className="fs-3 lh-sm fw-medium me-2">
            <FormattedMessage id="savingsFund.payment.form.paymentType.recurring" />
          </span>
          <Recommended />
        </p>
        <p className="m-0 text-body-secondary">
          <FormattedMessage id="savingsFund.payment.form.paymentType.recurring.description" />
        </p>
      </Radio>
    </div>
  </div>
);
