import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { PaymentDetailRow } from './row/PaymentDetailRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';

export const SwedbankRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
}> = ({ amount }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank" />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank.login" />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank.form" />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.fund" />}
          value={<FormattedMessage id="thirdPillarPayment.tuleva3rdPillarFund" />}
        />
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.account" />}
          value={<FormattedMessage id="thirdPillarPayment.chooseAccount" />}
        />
        <PaymentAmountRow
          amount={amount}
          label={<FormattedMessage id="thirdPillarPayment.amount" />}
        />
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.firstPaymentDate" />}
          value={<FormattedMessage id="thirdPillarPayment.yourPaymentDate" />}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage
        id="thirdPillarPayment.RECURRING.swedbank.extraStep"
        values={{
          b: (chunks: string) => <b>{chunks}</b>,
        }}
      />
    </PaymentStep>
    <PaymentStep number={4}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
    </PaymentStep>
  </div>
);
