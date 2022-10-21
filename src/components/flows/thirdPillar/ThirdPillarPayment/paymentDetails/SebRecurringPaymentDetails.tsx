import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentReferenceRow } from './row/PaymentReferenceRow';
import { TextRow } from './row/TextRow';
import { tenthDayOfMonth } from '../PaymentDate';

export const SebRecurringPaymentDetails: React.FunctionComponent<{
  paymentAmount: string;
  pensionAccountNumber: string;
}> = ({ paymentAmount, pensionAccountNumber }) => (
  <table>
    <tbody>
      <AccountNameRow>
        <FormattedMessage id="thirdPillarPayment.beneficiary" />
      </AccountNameRow>
      <AccountNumberRow bank="seb">
        <FormattedMessage id="thirdPillarPayment.beneficiaryAccount" />
      </AccountNumberRow>
      <PaymentAmountRow paymentAmount={paymentAmount}>
        <FormattedMessage id="thirdPillarPayment.amount" />
        {null}
      </PaymentAmountRow>
      <PaymentDescriptionRow>
        <FormattedMessage id="thirdPillarPayment.description" />
      </PaymentDescriptionRow>
      <PaymentReferenceRow pensionAccountNumber={pensionAccountNumber}>
        <FormattedMessage id="thirdPillarPayment.referenceNumber" />
      </PaymentReferenceRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.frequencyOfPayment" />
        <FormattedMessage id="thirdPillarPayment.onceAMonth" />
      </TextRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.firstPaymentDate2" />
        {tenthDayOfMonth()}
      </TextRow>
    </tbody>
  </table>
);
