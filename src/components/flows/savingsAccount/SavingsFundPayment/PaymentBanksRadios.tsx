import { FC } from 'react';
import Radio from '../../../common/radio';
import { BankKey, bankKeyToBankNameMap } from '../../thirdPillar/ThirdPillarPayment/types';

type PaymentBanksRadiosProps = {
  selected: BankKey | null;
  onSelect: (bank: BankKey) => void;
};
export const PaymentBanksRadios: FC<PaymentBanksRadiosProps> = ({ selected, onSelect }) => (
  <>
    {Object.keys(bankKeyToBankNameMap).map((bank) => (
      <Radio
        id={bank}
        key={bank}
        name="paymentMethod"
        selected={selected === bank}
        onSelect={() => onSelect(bank as BankKey)}
        className="p-3 d-block"
      >
        {bankKeyToBankNameMap[bank as BankKey]}
      </Radio>
    ))}
  </>
);
