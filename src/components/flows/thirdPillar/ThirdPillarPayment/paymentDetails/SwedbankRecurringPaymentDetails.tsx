import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ChoiceApplicationRow } from './row/ChoiceApplicationRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { TextRow } from './row/TextRow';
import { tenthDayOfMonth } from '../PaymentDate';

export const SwedbankRecurringPaymentDetails: React.FunctionComponent<{
  paymentAmount: string;
}> = ({ paymentAmount }) => (
  <table>
    <tbody>
      <ChoiceApplicationRow>
        <FormattedMessage id="thirdPillarPayment.fund" />
      </ChoiceApplicationRow>
      <PaymentAmountRow paymentAmount={paymentAmount}>
        <FormattedMessage id="thirdPillarPayment.amount" />
        {null}
      </PaymentAmountRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.purchaseRegularity" />
        <FormattedMessage id="thirdPillarPayment.regularPayments" />
      </TextRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.orderFrequency" />
        <FormattedMessage id="thirdPillarPayment.monthly" />
      </TextRow>
      <TextRow>
        <FormattedMessage id="thirdPillarPayment.firstPaymentDate" />
        {tenthDayOfMonth()}
      </TextRow>
    </tbody>
  </table>
);
