import React, { ChangeEventHandler, WheelEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentType } from '../../../common/apiModels';

export const PaymentAmountInput: React.FunctionComponent<{
  paymentType: PaymentType;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onWheel: WheelEventHandler<HTMLInputElement>;
  className?: string;
}> = ({ paymentType, value, onChange, onWheel, className = '' }) => (
  <label className={className} htmlFor="payment-amount">
    <b>
      {paymentType === 'SINGLE' && <FormattedMessage id="thirdPillarPayment.singlePaymentAmount" />}
      {paymentType === 'RECURRING' && (
        <FormattedMessage id="thirdPillarPayment.recurringPaymentAmount" />
      )}
      {paymentType === 'GIFT' && <FormattedMessage id="thirdPillarPayment.giftPaymentAmount" />}
    </b>
    <div className="form-inline">
      <div className="input-group input-group-lg mt-2">
        <input
          id="payment-amount"
          type="text"
          inputMode="decimal"
          placeholder={paymentType === 'RECURRING' ? '100' : '1000'}
          className="form-control form-control-lg"
          value={value}
          onChange={onChange}
          onWheel={onWheel}
          lang="et"
        />
        <div className="input-group-append">
          <span className="input-group-text">
            &euro;
            {paymentType === 'RECURRING' && <FormattedMessage id="thirdPillarPayment.perMonth" />}
          </span>
        </div>
      </div>
    </div>
  </label>
);
