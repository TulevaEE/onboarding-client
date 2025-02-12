import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';

export const LhvRecurringPaymentDetails: React.FunctionComponent = () => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage id="thirdPillarPayment.RECURRING.lhv" />
    </h3>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.lhv.login" />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.lhv.form" />
        <div className="mt-3 p-4 ms-n4 payment-details-table">
          <table>
            <tbody>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.fromAccount" />
                <FormattedMessage id="thirdPillarPayment.chooseAccount" />
              </TextRow>
              <TextRow>
                <FormattedMessage id="thirdPillarPayment.firstPayment" />
                <FormattedMessage id="thirdPillarPayment.yourPaymentDate" />
              </TextRow>
            </tbody>
          </table>
        </div>
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number me-3">
        <b>3</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage id="thirdPillarPayment.RECURRING.finalStep" />
      </span>
    </div>
  </div>
);
