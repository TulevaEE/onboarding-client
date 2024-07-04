import './Payment.scss';
import { PaymentType } from '../../../common/apiModels';
import { LuminorRecurringPaymentDetails } from './paymentDetails/LuminorRecurringPaymentDetails';
import { OtherBankPaymentDetails } from './paymentDetails/OtherBankPaymentDetails';
import { SwedbankRecurringPaymentDetails } from './paymentDetails/SwedbankRecurringPaymentDetails';
import { SebRecurringPaymentDetails } from './paymentDetails/SebRecurringPaymentDetails';
import { LhvRecurringPaymentDetails } from './paymentDetails/LhvRecurringPaymentDetails';
import { CoopRecurringPaymentDetails } from './paymentDetails/CoopRecurringPaymentDetails';
import { BankKey } from './types';

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

    {paymentBank === 'other' && (
      <OtherBankPaymentDetails
        personalCode={personalCode}
        amount={paymentAmount}
        paymentType={PaymentType.RECURRING}
      />
    )}
  </>
);
