import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';

export const OtherBankPaymentDetails: React.FunctionComponent<{
  paymentAmount: string;
  pensionAccountNumber: string;
}> = ({ paymentAmount, pensionAccountNumber }) => (
  <table>
    <tbody>
      <AccountNameRow>
        <FormattedMessage id="thirdPillarPayment.accountName" />
      </AccountNameRow>
      <AccountNumberRow bank="swedbank">
        <FormattedMessage id="thirdPillarPayment.accountNumber" />
      </AccountNumberRow>
      <PaymentDescriptionRow bank="other" pensionAccountNumber={pensionAccountNumber}>
        <FormattedMessage id="thirdPillarPayment.paymentDescription" />
      </PaymentDescriptionRow>
      <PaymentAmountRow paymentAmount={paymentAmount}>
        <FormattedMessage id="thirdPillarPayment.amount" />
        {null}
      </PaymentAmountRow>
    </tbody>
  </table>
);
