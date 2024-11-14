import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import './Payment.scss';
import { PaymentType } from '../../../common/apiModels';
import { AvailablePaymentType } from './types';

type Props = {
  paymentType: AvailablePaymentType;
  setPaymentType: (value: AvailablePaymentType) => unknown;
};

export const PaymentTypeSelection = ({ paymentType, setPaymentType }: Props) => (
  <>
    <div className="mt-5">
      <b>
        <FormattedMessage id="thirdPillarPayment.paymentType" />
      </b>
    </div>
    <Radio
      name="payment-type"
      id="payment-type-single"
      className="mt-3"
      selected={paymentType === PaymentType.SINGLE}
      onSelect={() => {
        setPaymentType(PaymentType.SINGLE);
      }}
    >
      <p className="m-0">
        <FormattedMessage id="thirdPillarPayment.SINGLE" />
      </p>
    </Radio>
    <Radio
      name="payment-type"
      id="payment-type-recurring"
      className="mt-3"
      selected={paymentType === PaymentType.RECURRING}
      onSelect={() => {
        setPaymentType(PaymentType.RECURRING);
      }}
    >
      <p className="m-0">
        <FormattedMessage id="thirdPillarPayment.RECURRING" />
      </p>
    </Radio>
  </>
);
