import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { PaymentDetailRow } from './row/PaymentDetailRow';

export const LhvRecurringPaymentDetails: React.FunctionComponent = () => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.lhv" />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.lhv.login" />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.lhv.form" />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.fromAccount" />}
          value={<FormattedMessage id="thirdPillarPayment.chooseAccount" />}
        />
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.firstPayment" />}
          value={<FormattedMessage id="thirdPillarPayment.yourPaymentDate" />}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
    </PaymentStep>
  </div>
);
