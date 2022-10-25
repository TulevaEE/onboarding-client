import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentReferenceRow } from './row/PaymentReferenceRow';

export const LhvRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
  pensionAccountNumber: string;
}> = ({ amount, pensionAccountNumber }) => (
  <table>
    <tbody>
      <AccountNameRow>
        <FormattedMessage id="thirdPillarPayment.beneficiarysName" />
      </AccountNameRow>
      <AccountNumberRow bank="lhv">
        <FormattedMessage id="thirdPillarPayment.beneficiaryAccountNumber" />
      </AccountNumberRow>
      <PaymentAmountRow amount={amount}>
        <FormattedMessage id="thirdPillarPayment.amount" />
        <FormattedMessage id="thirdPillarPayment.fixedAmount" />
      </PaymentAmountRow>
      <PaymentDescriptionRow>
        <FormattedMessage id="thirdPillarPayment.explanation" />
      </PaymentDescriptionRow>
      <PaymentReferenceRow pensionAccountNumber={pensionAccountNumber}>
        <FormattedMessage id="thirdPillarPayment.referenceNo" />
      </PaymentReferenceRow>

      {/* <EmptyRow /> */}

      {/* <TextRow> */}
      {/*  <FormattedMessage id="thirdPillarPayment.contractStart" /> */}
      {/*  {today()} */}
      {/* </TextRow> */}
      {/* <TextRow> */}
      {/*  <FormattedMessage id="thirdPillarPayment.paymentFrequency" /> */}
      {/*  <FormattedMessage id="thirdPillarPayment.monthly2" /> */}
      {/* </TextRow> */}
      {/* <TextRow> */}
      {/*  <FormattedMessage id="thirdPillarPayment.firstPayment" /> */}
      {/*  {tenthDayOfMonth()} */}
      {/* </TextRow> */}
    </tbody>
  </table>
);
