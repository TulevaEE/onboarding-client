import React from 'react';
import { FormattedMessage } from 'react-intl';
import { FundRow } from './row/FundRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';
import { TextRow } from './row/TextRow';

export const SwedbankRecurringPaymentDetails: React.FunctionComponent<{
  amount: string;
}> = ({ amount }) => (
  <div className="mt-4 recurring-payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.recurringPayment.swedbank" />
    </h3>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.recurringPayment.swedbank.login" />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.recurringPayment.swedbank.form" />
        <div className="mt-2 p-4 payment-details-table">
          <table>
            <tbody>
              <FundRow>
                <FormattedMessage id="thirdPillarPayment.fund" />
              </FundRow>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.account" />
                <FormattedMessage id="thirdPillarPayment.chooseAccount" />
              </TextRow>
              <PaymentAmountRow amount={amount}>
                <FormattedMessage id="thirdPillarPayment.amount" />
                {null}
              </PaymentAmountRow>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.firstPaymentDate" />
                <FormattedMessage id="thirdPillarPayment.yourPaymentDate" />
              </TextRow>
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
        <FormattedMessage
          id="thirdPillarPayment.RECURRING.swedbank.extraStep"
          values={{
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>4</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </span>
    </div>
  </div>
);
