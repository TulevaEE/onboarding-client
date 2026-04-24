import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';

export type SavingsFundPaymentType = 'SINGLE' | 'RECURRING';

type Props = {
  paymentType: SavingsFundPaymentType;
  setPaymentType: (value: SavingsFundPaymentType) => void;
};

export const PaymentTypeSelection = ({ paymentType, setPaymentType }: Props) => (
  <div className="d-flex flex-column gap-3">
    <p className="fs-3 fw-semibold m-0">
      <FormattedMessage id="savingsFund.payment.form.paymentType.label" />
    </p>
    <div className="d-flex flex-column gap-2">
      <Radio
        name="savings-payment-type"
        id="savings-payment-type-single"
        selected={paymentType === 'SINGLE'}
        onSelect={() => setPaymentType('SINGLE')}
      >
        <p className="m-0">
          <FormattedMessage id="savingsFund.payment.form.paymentType.single" />
        </p>
      </Radio>
      <Radio
        name="savings-payment-type"
        id="savings-payment-type-recurring"
        selected={paymentType === 'RECURRING'}
        onSelect={() => setPaymentType('RECURRING')}
      >
        <p className="m-0">
          <FormattedMessage id="savingsFund.payment.form.paymentType.recurring" />
        </p>
      </Radio>
    </div>
  </div>
);
