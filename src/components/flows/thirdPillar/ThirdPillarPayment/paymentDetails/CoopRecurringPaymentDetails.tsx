import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentDetailRow } from './row/PaymentDetailRow';

export const CoopRecurringPaymentDetails: React.FunctionComponent = () => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.coop" />
    </h3>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.coop.login" />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.coop.form" />
        <div className="mt-3 p-4 payment-details-table">
          <PaymentDetailRow
            label={<FormattedMessage id="thirdPillarPayment.payer" />}
            value={<FormattedMessage id="thirdPillarPayment.chooseAccount" />}
          />
          <PaymentDetailRow
            label={<FormattedMessage id="thirdPillarPayment.firstPayment" />}
            value={<FormattedMessage id="thirdPillarPayment.yourPaymentDate" />}
          />
        </div>
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </div>
    </div>
  </div>
);
