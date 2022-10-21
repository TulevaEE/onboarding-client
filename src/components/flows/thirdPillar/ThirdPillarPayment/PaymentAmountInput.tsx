import React, { ChangeEventHandler, WheelEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentType } from '../../../common/apiModels';

export const PaymentAmountInput: React.FunctionComponent<{
  paymentType: PaymentType;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onWheel: WheelEventHandler<HTMLInputElement>;
}> = ({ paymentType, value, onChange, onWheel }) => (
  <label className="mt-5" htmlFor="payment-amount">
    <b>
      {paymentType === PaymentType.SINGLE && (
        <FormattedMessage id="thirdPillarPayment.singlePaymentAmount" />
      )}
      {paymentType === PaymentType.RECURRING && (
        <FormattedMessage id="thirdPillarPayment.recurringPaymentAmount" />
      )}
    </b>
    <div className="form-inline">
      <div className="input-group input-group-lg mt-2">
        <input
          id="payment-amount"
          type="number"
          placeholder={paymentType === PaymentType.SINGLE ? '6000' : '500'}
          className="form-control form-control-lg"
          min="0.00"
          step="0.01"
          value={value}
          onChange={onChange}
          onWheel={onWheel}
        />
        <div className="input-group-append">
          <span className="input-group-text">
            &euro;
            {paymentType === PaymentType.RECURRING && (
              <FormattedMessage id="thirdPillarPayment.perMonth" />
            )}
          </span>
        </div>
      </div>
    </div>
  </label>
);
