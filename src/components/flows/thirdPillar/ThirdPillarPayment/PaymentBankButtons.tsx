import { BankButton } from './BankButton';
import { BANK_KEYS, BankKey } from './types';
import { TranslationKey } from '../../../translations';

type Props = {
  paymentBank: BankKey | 'other' | null;
  setPaymentBank: (value: BankKey | 'other' | null) => unknown;
  showOther?: boolean;
  otherLabel?: TranslationKey;
};

export const PaymentBankButtons = ({
  paymentBank,
  setPaymentBank,
  showOther = true,
  otherLabel,
}: Props) => (
  <>
    <div className="row g-2 payment-banks">
      {BANK_KEYS.map((bankKey) => (
        <BankButton
          bankKey={bankKey}
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
          key={bankKey}
        />
      ))}
      {showOther && (
        <BankButton
          bankKey="other"
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
          otherLabel={otherLabel}
        />
      )}
    </div>
  </>
);
