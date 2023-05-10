import React from 'react';

export const BankButton: React.FunctionComponent<{
  bankKey: string;
  bankName: string;
  paymentBank: string;
  setPaymentBank: (paymentBank: string) => void;
  disabled?: boolean;
}> = ({ bankKey, bankName, paymentBank, setPaymentBank, disabled = false }) => {
  return (
    <div className="btn-group-toggle d-inline-block mt-2 mr-2">
      <label
        className={`btn btn-light btn-payment btn-${bankKey} text-nowrap ${
          paymentBank === bankKey ? 'active' : ''
        }`}
      >
        <input
          type="radio"
          name="banks"
          id={bankKey}
          checked={paymentBank === bankKey}
          onChange={() => {
            setPaymentBank(bankKey);
          }}
          disabled={disabled}
        />
        {bankName}
      </label>
    </div>
  );
};
