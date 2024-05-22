import React, { PropsWithChildren, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';
import { useMe } from '../../../../common/apiHooks';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { getFullName } from '../../../../common/utils';
import { User } from '../../../../common/apiModels';
import Radio from '../../../../common/radio';

export const EmployerPaymentDetails = () => {
  const { data: user } = useMe();

  const [employerType, setEmployerType] = useState<'private' | 'public' | null>();

  if (!user) {
    return <Shimmer height={500} />;
  }

  return (
    <div className="mt-4 payment-details p-4">
      <h3>
        <FormattedMessage id="thirdPillarPayment.EMPLOYER.title" />
      </h3>
      <Radio
        name="payment-type"
        id="payment-type-single"
        className="mt-3 p-3"
        selected={employerType === 'private'}
        onSelect={() => {
          setEmployerType('private');
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.privateEmployer" />
        </p>
      </Radio>
      <Radio
        name="payment-type"
        id="payment-type-recurring"
        className="mt-3"
        selected={employerType === 'public'}
        onSelect={() => {
          setEmployerType('public');
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.publicEmployer" />
        </p>
      </Radio>

      {employerType && (
        <div className="pt-3">
          {employerType === 'private' && <PrivateEmployerGuide user={user} />}
          {employerType === 'public' && null}
        </div>
      )}
    </div>
  );
};

const PrivateEmployerGuide = ({ user }: { user: User }) => (
  <>
    <Step number={1}>
      <a
        className="btn btn-primary text-nowrap px-3"
        href="https://docs.google.com/document/d/1ZnF9CBxnXWzCjDz-wk1H84pz_yD3EIcD3WPBYt5RuDA/edit"
        target="_blank"
        rel="noreferrer"
      >
        <FormattedMessage id="thirdPillarPayment.EMPLOYER.form" />
      </a>
    </Step>

    <Step number={2}>
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
    </Step>
    <Step number={3}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.digitalSignature" />
    </Step>
    <Step number={4}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.salaryPayment" />
    </Step>
  </>
);

const Step = ({ number, children }: PropsWithChildren<{ number: number }>) => (
  <div className="d-sm-flex py-2">
    <span className="flex-shrink-0 tv-step__number mr-3">
      <b>{number}</b>
    </span>
    <span className="flex-grow-1 align-self-center">{children}</span>
  </div>
);
