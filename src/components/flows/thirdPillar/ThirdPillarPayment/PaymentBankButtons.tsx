import { BankButton } from './BankButton';
import { BankKey } from './types';

type Props = {
  paymentBank: BankKey | 'other' | null;
  setPaymentBank: (value: BankKey | 'other' | null) => unknown;
  showOther?: boolean;
};

const BANK_KEYS: readonly BankKey[] = ['swedbank', 'seb', 'lhv', 'luminor', 'coop'];

export const PaymentBankButtons = ({ paymentBank, setPaymentBank, showOther = true }: Props) => (
  <>
    <div className="d-flex gap-2 flex-wrap mt-2 payment-banks">
      {BANK_KEYS.map((bankKey) => (
        <BankButton
          bankKey={bankKey}
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
          key={bankKey}
        />
      ))}
      {showOther && (
        <BankButton bankKey="other" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      )}
    </div>
  </>
);
