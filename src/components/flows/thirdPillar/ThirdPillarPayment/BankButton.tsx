import React from 'react';
import { useIntl } from 'react-intl';
import { BankKey, bankKeyToBankNameMap } from './types';

type Props = {
  bankKey: BankKey | 'other';
  paymentBank: BankKey | 'other' | null;
  setPaymentBank: (paymentBank: BankKey | 'other') => void;
  disabled?: boolean;
};

export const BankButton = ({ bankKey, paymentBank, setPaymentBank, disabled = false }: Props) => {
  const { formatMessage } = useIntl();

  const getBankName = (key: Props['bankKey']) => {
    if (key === 'other') {
      return formatMessage({ id: 'thirdPillarPayment.otherBank' });
    }

    return bankKeyToBankNameMap[key];
  };

  return (
    <div className="btn-group-toggle d-inline-block mt-2 me-2">
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
        {getBankName(bankKey)}
      </label>
    </div>
  );
};
