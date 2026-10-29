import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { AccountNameRow } from './row/AccountNameRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';

const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

export const WiseRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
  personalCode: string;
}> = ({ amount, personalCode }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.wise" />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.wise.login" />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.wise.form" values={{ b: bold }} />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <AccountNameRow label={<FormattedMessage id="thirdPillarPayment.beneficiaryName" />} />
        <AccountNumberRow
          bank="swedbank"
          label={<FormattedMessage id="thirdPillarPayment.accountNumber" />}
        />
        <PaymentAmountRow
          amount={amount}
          label={<FormattedMessage id="thirdPillarPayment.amountInEur" />}
          tooltip={<></>}
        />
        <PaymentDescriptionRow
          personalCode={personalCode}
          label={<FormattedMessage id="thirdPillarPayment.description" />}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.wise.schedule" values={{ b: bold }} />
    </PaymentStep>
    <PaymentStep number={4}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
    </PaymentStep>
  </div>
);
