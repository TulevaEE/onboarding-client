import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';
import { useMe } from '../../../../common/apiHooks';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { getFullName } from '../../../../common/utils';

export const EmployerPaymentDetails = () => {
  const { data: user } = useMe();

  if (!user) {
    return <Shimmer height={500} />;
  }

  return (
    <div className="mt-4 payment-details p-4">
      <h3>
        <FormattedMessage id="thirdPillarPayment.EMPLOYER.title" />
      </h3>
      <div className="d-sm-flex py-2">
        <span className="flex-shrink-0 tv-step__number mr-3">
          <b>1</b>
        </span>
        <span className="flex-grow-1 align-self-center">
          <a
            className="btn btn-primary text-nowrap px-3"
            href="https://docs.google.com/document/d/1ZnF9CBxnXWzCjDz-wk1H84pz_yD3EIcD3WPBYt5RuDA/edit"
            target="_blank"
            rel="noreferrer"
          >
            <FormattedMessage id="thirdPillarPayment.EMPLOYER.form" />
          </a>
        </span>
      </div>

      <div className="d-sm-flex py-2">
        <span className="flex-shrink-0 tv-step__number mr-3">
          <b>2</b>
        </span>
        <span className="flex-grow-1 align-self-center">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.formFields" />
          <div className="mt-3 p-4 ml-n4 payment-details-table">
            <table>
              <tbody>
                <TextRow>
                  <FormattedMessage id="thirdPillarPayment.EMPLOYER.percent" />
                  <FormattedMessage id="thirdPillarPayment.EMPLOYER.percent.description" />
                </TextRow>
                <TextRow>
                  <FormattedMessage id="thirdPillarPayment.EMPLOYER.pensionAccountNumber" />
                  {user.pensionAccountNumber}
                </TextRow>
                <TextRow>
                  <FormattedMessage id="thirdPillarPayment.EMPLOYER.fullName" />
                  {getFullName(user)}
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
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.digitalSignature" />
        </span>
      </div>
      <div className="d-sm-flex py-2">
        <span className="flex-shrink-0 tv-step__number mr-3">
          <b>4</b>
        </span>
        <span className="flex-grow-1 align-self-center">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.salaryPayment" />
        </span>
      </div>
    </div>
  );
};
