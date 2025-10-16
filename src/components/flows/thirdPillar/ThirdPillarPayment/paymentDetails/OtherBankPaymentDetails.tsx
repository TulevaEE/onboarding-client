import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AccountNameRow } from './row/AccountNameRow';
import { AccountNumberRow } from './row/AccountNumberRow';
import { PaymentDescriptionRow } from './row/PaymentDescriptionRow';
import { PaymentAmountRow } from './row/PaymentAmountRow';

export const OtherBankPaymentDetails: React.FunctionComponent<{
  amount: string;
  personalCode: string;
  paymentType: 'SINGLE' | 'RECURRING';
}> = ({ amount, personalCode, paymentType }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id={`thirdPillarPayment.${paymentType}.other`} />
    </h3>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.login`} />
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.other.form`} />
        <div className="mt-3 p-4 payment-details-table">
          <AccountNameRow label={<FormattedMessage id="thirdPillarPayment.accountName" />} />
          <AccountNumberRow
            bank="swedbank"
            label={<FormattedMessage id="thirdPillarPayment.accountNumber" />}
          />
          <PaymentDescriptionRow
            personalCode={personalCode}
            label={<FormattedMessage id="thirdPillarPayment.paymentDescription" />}
          />
          <PaymentAmountRow
            amount={amount}
            label={<FormattedMessage id="thirdPillarPayment.amount" />}
            tooltip={<></>}
          />
        </div>
      </div>
    </div>
    <div className="d-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <div className="flex-grow-1 align-self-center">
        <FormattedMessage id={`thirdPillarPayment.${paymentType}.finalStep`} />
      </div>
    </div>
  </div>
);
