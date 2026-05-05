import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';

export const OtherBankPaymentDetails: React.FunctionComponent<{
  amount: string;
  personalCode: string;
  paymentType: 'SINGLE' | 'RECURRING';
}> = ({ amount, personalCode, paymentType }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.other`} />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.login`} />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.form`} />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <AccountNameRow label={<FormattedMessage id="thirdPillarPayment.accountName" />} />
        <AccountNumberRow
          bank="swedbank"
          label={<FormattedMessage id="thirdPillarPayment.accountNumber" />}
        />
        <PaymentDescriptionRow
          personalCode={personalCode}
          label={<FormattedMessage id="thirdPillarPayment.paymentDescription" />}
        />
        <PaymentAmountRow
          amount={amount}
          label={<FormattedMessage id="thirdPillarPayment.amount" />}
          tooltip={<></>}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.finalStep`} />
    </PaymentStep>
  </div>
);
