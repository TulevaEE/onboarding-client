import './Payment.scss';
import { LuminorRecurringPaymentDetails } from './paymentDetails/LuminorRecurringPaymentDetails';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { SwedbankRecurringPaymentDetails } from './paymentDetails/SwedbankRecurringPaymentDetails';
import { SebRecurringPaymentDetails } from './paymentDetails/SebRecurringPaymentDetails';
import { LhvRecurringPaymentDetails } from './paymentDetails/LhvRecurringPaymentDetails';
import { CoopRecurringPaymentDetails } from './paymentDetails/CoopRecurringPaymentDetails';
import { WiseRecurringPaymentDetails } from './paymentDetails/WiseRecurringPaymentDetails';
import { BankKey, hasStandingOrderLink } from './types';

type Props = {
  paymentBank: BankKey | 'other';
  paymentAmount: string;
  personalCode: string;
};

export const RecurringPaymentDetails = ({ paymentBank, paymentAmount, personalCode }: Props) => (
  <>
    {paymentBank === 'swedbank' && <SwedbankRecurringPaymentDetails amount={paymentAmount} />}

    {paymentBank === 'seb' && <SebRecurringPaymentDetails />}

    {paymentBank === 'lhv' && <LhvRecurringPaymentDetails />}

    {paymentBank === 'luminor' && (
      <LuminorRecurringPaymentDetails amount={paymentAmount} personalCode={personalCode} />
    )}

    {paymentBank === 'coop' && <CoopRecurringPaymentDetails />}

    {paymentBank === 'wise' && (
      <WiseRecurringPaymentDetails amount={paymentAmount} personalCode={personalCode} />
    )}

    {!hasStandingOrderLink(paymentBank) && (
      <OtherBankPaymentDetails
        personalCode={personalCode}
        amount={paymentAmount}
        paymentType="RECURRING"
        titleId={
          paymentBank === 'other'
            ? 'thirdPillarPayment.RECURRING.other'
            : 'thirdPillarPayment.RECURRING.yourBank'
        }
      />
    )}
  </>
);
