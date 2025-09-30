import React from 'react';
import { useIntl } from 'react-intl';
import { BankKey, bankKeyToBankNameMap } from './types';

type Props = {
  bankKey: BankKey | 'other';
  paymentBank: BankKey | 'other' | null;
  setPaymentBank: (paymentBank: BankKey | 'other' | null) => void;
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
    <label
      className={`btn btn-outline-secondary btn-payment btn-${bankKey} ${
        paymentBank === bankKey ? 'active' : ''
      }`}
    >
      <input
        className="btn-check"
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
  );
};
