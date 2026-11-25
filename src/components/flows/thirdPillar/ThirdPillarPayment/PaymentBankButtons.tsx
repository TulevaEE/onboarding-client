import { FormattedMessage } from 'react-intl';
import { BankButton } from './BankButton';
import { BankKey, ESTONIAN_BANK_KEYS, OTHER_BANK_KEYS } from './types';
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
      {ESTONIAN_BANK_KEYS.map((bankKey) => (
        <BankButton
          bankKey={bankKey}
          paymentBank={paymentBank}
          setPaymentBank={setPaymentBank}
          key={bankKey}
        />
      ))}
    </div>
    <p id="other-payment-banks" className="mt-4 mb-2 text-body-secondary">
      <FormattedMessage id="thirdPillarPayment.otherBanks" />
    </p>
    <div className="row g-2 payment-banks" role="group" aria-labelledby="other-payment-banks">
      {OTHER_BANK_KEYS.map((bankKey) => (
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
