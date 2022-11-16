import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';

export const SebRecurringPaymentDetails: React.FunctionComponent = () => (
  <div className="mt-4 recurring-payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.recurringPayment.seb" />
    </h3>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.recurringPayment.seb.login" />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.recurringPayment.seb.form" />
        <div className="mt-2 p-4 payment-details-table">
          <table>
            <tbody>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.bankAccount" />
                <FormattedMessage id="thirdPillarPayment.chooseAccount" />
              </TextRow>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.firstPaymentDate2" />
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
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </span>
    </div>
  </div>
);
