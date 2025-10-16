import React from 'react';
import { FormattedMessage } from 'react-intl';
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
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.login" />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.form" />
        <div className="mt-3 p-4 payment-details-table">
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
