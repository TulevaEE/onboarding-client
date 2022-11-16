import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { PaymentType } from '../../../../common/apiModels';

export const OtherBankPaymentDetails: React.FunctionComponent<{
  amount: string;
  pensionAccountNumber: string;
  paymentType: PaymentType;
}> = ({ amount, pensionAccountNumber, paymentType }) => (
  <div className="mt-4 recurring-payment-details p-4">
    <h3>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.other`} />
    </h3>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.login`} />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.form`} />
        <div className="mt-2 p-4 payment-details-table">
          <table>
            <tbody>
              <AccountNameRow>
                <FormattedMessage id="thirdPillarPayment.accountName" />
              </AccountNameRow>
              <AccountNumberRow bank="swedbank">
                <FormattedMessage id="thirdPillarPayment.accountNumber" />
              </AccountNumberRow>
              <PaymentDescriptionRow bank="other" pensionAccountNumber={pensionAccountNumber}>
                <FormattedMessage id="thirdPillarPayment.paymentDescription" />
              </PaymentDescriptionRow>
              <PaymentAmountRow amount={amount}>
                <FormattedMessage id="thirdPillarPayment.amount" />
                {null}
              </PaymentAmountRow>
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
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.finalStep`} />
      </span>
    </div>
  </div>
);
