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
    <div className="col-6 col-sm-4">
      <label
        className={`btn btn-outline-secondary btn-payment d-block btn-${bankKey} ${
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
    </div>
  );
};
