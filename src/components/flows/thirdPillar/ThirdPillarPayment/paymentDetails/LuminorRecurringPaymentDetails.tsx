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
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.login" />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.luminor.form" />
        <div className="mt-2 p-4 payment-details-table">
          <table>
            <tbody>
              <AccountNameRow>
                <FormattedMessage id="thirdPillarPayment.beneficiaryName" />
              </AccountNameRow>
              <PaymentAmountRow amount={amount}>
                <FormattedMessage id="thirdPillarPayment.amountInEur" />
                {null}
              </PaymentAmountRow>
              <AccountNumberRow bank="luminor">
                <FormattedMessage id="thirdPillarPayment.accountNumber" />
              </AccountNumberRow>
              <PaymentDescriptionRow personalCode={personalCode}>
                <FormattedMessage id="thirdPillarPayment.description" />
              </PaymentDescriptionRow>
            </tbody>
          </table>
        </div>
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>3</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </span>
    </div>
  </div>
);
