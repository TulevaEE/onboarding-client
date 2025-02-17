import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import './Payment.scss';
import { AvailablePaymentType } from './types';

type Props = {
  paymentType: AvailablePaymentType;
  setPaymentType: (value: AvailablePaymentType) => unknown;
};

export const PaymentTypeSelection = ({ paymentType, setPaymentType }: Props) => (
  <>
    <p className="mt-5 mb-2 fw-bold">
      <FormattedMessage id="thirdPillarPayment.paymentType" />
    </p>
    <Radio
      name="payment-type"
      id="payment-type-single"
      className="mb-2"
      selected={paymentType === 'SINGLE'}
      onSelect={() => {
        setPaymentType('SINGLE');
      }}
    >
      <p className="m-0">
        <FormattedMessage id="thirdPillarPayment.SINGLE" />
      </p>
    </Radio>
    <Radio
      name="payment-type"
      id="payment-type-recurring"
      selected={paymentType === 'RECURRING'}
      onSelect={() => {
        setPaymentType('RECURRING');
      }}
    >
      <p className="m-0">
        <FormattedMessage id="thirdPillarPayment.RECURRING" />
      </p>
    </Radio>
  </>
);
