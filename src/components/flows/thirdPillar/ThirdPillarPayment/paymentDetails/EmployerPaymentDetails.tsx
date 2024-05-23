import { PropsWithChildren, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';
import { useMe } from '../../../../common/apiHooks';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { getFullName } from '../../../../common/utils';
import { User } from '../../../../common/apiModels';
import Radio from '../../../../common/radio';

export const EmployerPaymentDetails = () => {
  const { data: user } = useMe();

  const [employerType, setEmployerType] = useState<'PRIVATE_SECTOR' | 'PUBLIC_SECTOR'>(
    'PRIVATE_SECTOR',
  );

  if (!user) {
    return <Shimmer height={500} />;
  }

  return (
    <>
      <h2 className="mt-3">
        <FormattedMessage id="thirdPillarPayment.EMPLOYER.title" />
      </h2>
      <Radio
        name="employer-type"
        id="employer-type-private"
        className="mt-4 p-3"
        selected={employerType === 'PRIVATE_SECTOR'}
        onSelect={() => {
          setEmployerType('PRIVATE_SECTOR');
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.privateEmployer" />
        </p>
      </Radio>
      <Radio
        name="employer-type"
        id="employer-type-public"
        className="mt-3"
        selected={employerType === 'PUBLIC_SECTOR'}
        onSelect={() => {
          setEmployerType('PUBLIC_SECTOR');
        }}
      >
        <p className="m-0">
          <FormattedMessage id="thirdPillarPayment.EMPLOYER.publicEmployer" />
        </p>
      </Radio>

      <div className="p-4 mt-5 payment-details">
        {employerType === 'PRIVATE_SECTOR' && <PrivateEmployerGuide user={user} />}
        {employerType === 'PUBLIC_SECTOR' && <PublicEmployerGuide user={user} />}
      </div>
    </>
  );
};

const PublicEmployerGuide = ({ user }: { user: User }) => (
  <>
    <Step number={1}>
      <a
        className="btn btn-primary text-nowrap px-3"
        href="https://www.riigitootaja.ee/rtip-client/login"
        target="_blank"
        rel="noreferrer"
      >
        <FormattedMessage id="thirdPillarPayment.EMPLOYER.signInToRtk" />
      </a>
    </Step>

    <Step number={2}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.rtkNavigationGuide" />
    </Step>

    <Step number={3}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.rtkFormFields" />
      <div className="mt-3 p-4 ml-n4 payment-details-table">
        <table>
          <tbody>
            <TextRow>
              <FormattedMessage id="thirdPillarPayment.EMPLOYER.rtkAmount" />
              <FormattedMessage id="thirdPillarPayment.EMPLOYER.rtkAmount.description" />
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
    <Step number={4}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.rtkDigitalSignature" />
    </Step>
    <Step number={5}>
      <FormattedMessage id="thirdPillarPayment.EMPLOYER.salaryPayment" />
    </Step>
  </>
);

export const PrivateEmployerGuide = ({ user }: { user: User }) => (
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
