import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { AccountNameRow } from './row/AccountNameRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';

export const LuminorRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
  personalCode: string;
}> = ({ amount, personalCode }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.luminor" />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.login" />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.form" />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <AccountNameRow label={<FormattedMessage id="thirdPillarPayment.beneficiaryName" />} />
        <PaymentAmountRow
          amount={amount}
          label={<FormattedMessage id="thirdPillarPayment.amountInEur" />}
          tooltip={<></>}
        />
        <AccountNumberRow
          bank="luminor"
          label={<FormattedMessage id="thirdPillarPayment.accountNumber" />}
        />
        <PaymentDescriptionRow
          personalCode={personalCode}
          label={<FormattedMessage id="thirdPillarPayment.description" />}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
    </PaymentStep>
  </div>
);
