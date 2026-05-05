import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../../../common/PaymentStep/PaymentStep';
import { PaymentDetailRow } from './row/PaymentDetailRow';

export const SebRecurringPaymentDetails: React.FunctionComponent = () => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.seb" />
    </h3>
    <PaymentStep number={1}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.seb.login" />
    </PaymentStep>
    <PaymentStep number={2}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.seb.form" />
      <div className="mt-3 p-3 p-md-4 payment-details-table">
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.bankAccount" />}
          value={<FormattedMessage id="thirdPillarPayment.chooseAccount" />}
        />
        <PaymentDetailRow
          label={<FormattedMessage id="thirdPillarPayment.firstPaymentDate2" />}
          value={<FormattedMessage id="thirdPillarPayment.yourPaymentDate" />}
        />
      </div>
    </PaymentStep>
    <PaymentStep number={3}>
      <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
    </PaymentStep>
  </div>
);
