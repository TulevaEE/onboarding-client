import { FormattedMessage } from 'react-intl';
import { Radio } from '../../../common';
import { Recommended } from '../../../common/Recommended';
import './Payment.scss';
import { AvailablePaymentType } from './types';

type Props = {
  paymentType: AvailablePaymentType;
  setPaymentType: (value: AvailablePaymentType) => unknown;
};

export const PaymentTypeSelection = ({ paymentType, setPaymentType }: Props) => (
  <>
    <p id="payment-type-label" className="mt-5 mb-2 fw-bold">
      <FormattedMessage id="thirdPillarPayment.paymentType" />
    </p>
    <div
      className="d-flex flex-column gap-2"
      role="radiogroup"
      aria-labelledby="payment-type-label"
    >
      <Radio
        name="payment-type"
        id="payment-type-single"
        selected={paymentType === 'SINGLE'}
        onSelect={() => {
          setPaymentType('SINGLE');
        }}
      >
        <p className="m-0">
          <span className="fs-3 lh-sm fw-medium">
            <FormattedMessage id="thirdPillarPayment.SINGLE" />
          </span>
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
        <p className="mb-1">
          <span className="fs-3 lh-sm fw-medium me-2">
            <FormattedMessage id="thirdPillarPayment.RECURRING" />
          </span>
          <Recommended />
        </p>
        <p className="m-0 text-body-secondary">
          <FormattedMessage id="thirdPillarPayment.paymentType.recurring.description" />
        </p>
      </Radio>
    </div>
  </>
);
