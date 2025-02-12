import { BankButton } from './BankButton';
import { BankKey } from './types';

type Props = {
  paymentBank: BankKey | 'other' | null;
  setPaymentBank: (value: BankKey | 'other' | null) => unknown;
};

export const PaymentBankButtons = ({ paymentBank, setPaymentBank }: Props) => (
  <>
    <div className="d-flex gap-2 flex-wrap mt-2 payment-banks">
      <BankButton bankKey="swedbank" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      <BankButton bankKey="seb" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      <BankButton bankKey="lhv" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      <BankButton bankKey="luminor" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      <BankButton bankKey="coop" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
      <BankButton bankKey="other" paymentBank={paymentBank} setPaymentBank={setPaymentBank} />
    </div>
  </>
);
