import React, { ChangeEventHandler, WheelEventHandler, useState } from 'react';
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
  const [showWarning, setShowWarning] = useState(false);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const inputValue = event.target.value;
    const numericValue = parseFloat(inputValue.replace(',', '.'));

    if (max !== undefined) {
      if (paymentType === 'RECURRING') {
        setShowWarning(numericValue > max / 12);
      } else {
        setShowWarning(numericValue > max);
      }
    }

    onChange(event);
  };

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
          onChange={handleInputChange}
          onWheel={onWheel}
          lang="et"
        />
        <div className="input-group-text">
          &euro;
          {paymentType === 'RECURRING' && <FormattedMessage id="thirdPillarPayment.perMonth" />}
        </div>
      </div>
      {showWarning && max !== undefined && (
        <div className="alert alert-warning mt-2 mb-0" role="alert">
          <FormattedMessage id="thirdPillarPayment.warningAmountExceeded" values={{ max }} />
        </div>
      )}
    </>
  );
};
