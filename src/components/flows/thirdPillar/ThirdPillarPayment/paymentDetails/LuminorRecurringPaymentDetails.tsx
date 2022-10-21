import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { TextRow } from './row/TextRow';
import { tenthDayOfMonth } from '../PaymentDate';
import { EmptyRow } from './row/EmptyRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentReferenceRow } from './row/PaymentReferenceRow';

export const LuminorRecurringPaymentDetails: React.FunctionComponent<{
  paymentAmount: string;
  pensionAccountNumber: string;
}> = ({ paymentAmount, pensionAccountNumber }) => (
  <table>
    <tbody>
      <AccountNameRow>
        <FormattedMessage id="thirdPillarPayment.beneficiaryName" />
      </AccountNameRow>
      <PaymentAmountRow paymentAmount={paymentAmount}>
        <FormattedMessage id="thirdPillarPayment.amountInEur" />
        {null}
      </PaymentAmountRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.selectFrequency" />
        <FormattedMessage id="thirdPillarPayment.onceAMonth2" />
      </TextRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.startDate" />
        {tenthDayOfMonth()}
      </TextRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.untilDate" />
        <FormattedMessage id="thirdPillarPayment.indefinitely" />
      </TextRow>

      <EmptyRow />

      <AccountNumberRow bank="luminor">
        <FormattedMessage id="thirdPillarPayment.accountNumber" />
      </AccountNumberRow>
      <PaymentDescriptionRow>
        <FormattedMessage id="thirdPillarPayment.description" />
      </PaymentDescriptionRow>
      <PaymentReferenceRow pensionAccountNumber={pensionAccountNumber}>
        <FormattedMessage id="thirdPillarPayment.reference" />
      </PaymentReferenceRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.standingOrderName" />
        <FormattedMessage id="thirdPillarPayment.thirdPillar" />
      </TextRow>
    </tbody>
  </table>
);
