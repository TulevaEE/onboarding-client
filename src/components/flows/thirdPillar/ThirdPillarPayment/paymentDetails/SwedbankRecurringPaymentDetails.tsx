import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentDetailRow } from './row/PaymentDetailRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';

export const SwedbankRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
}> = ({ amount }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank" />
    </h3>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank.login" />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.swedbank.form" />
        <div className="mt-3 p-4 payment-details-table">
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
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage
          id="thirdPillarPayment.RECURRING.swedbank.extraStep"
          values={{
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>4</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </div>
    </div>
  </div>
);
