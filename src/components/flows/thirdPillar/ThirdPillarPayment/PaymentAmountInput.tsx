import React, { ChangeEventHandler, WheelEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentType } from '../../../common/apiModels';

export const PaymentAmountInput: React.FunctionComponent<{
  paymentType: PaymentType;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onWheel?: WheelEventHandler<HTMLInputElement>;
  className?: string;
  max?: number;
}> = ({ paymentType, value, onChange, onWheel, className = '', max }) => {
  const numericValue = parseFloat(value.replace(',', '.'));
  const showWarning =
    max !== undefined &&
    (paymentType === 'RECURRING' ? numericValue > max / 12 : numericValue > max);

  return (
    <>
      <label className={className} htmlFor="payment-amount">
        {paymentType === 'SINGLE' && (
          <FormattedMessage id="thirdPillarPayment.singlePaymentAmount" />
        )}
        {paymentType === 'RECURRING' && (
          <FormattedMessage id="thirdPillarPayment.recurringPaymentAmount" />
        )}
        {paymentType === 'GIFT' && <FormattedMessage id="thirdPillarPayment.giftPaymentAmount" />}
      </label>
      <div className="input-group input-group-lg w-50">
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
        <div className="input-group-text">
          &euro;
          {paymentType === 'RECURRING' && <FormattedMessage id="thirdPillarPayment.perMonth" />}
        </div>
      </div>
      {showWarning && (
        <div className="alert alert-warning mt-2 mb-0" role="alert">
          <FormattedMessage id="thirdPillarPayment.warningAmountExceeded" values={{ max }} />
        </div>
      )}
    </>
  );
};
