import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { VerifiedChild } from '../types';

type ChildConfirmStepProps = {
  child: VerifiedChild;
};

// dateOfBirth arrives as an ISO date (YYYY-MM-DD) from the population register.
const formatDateOfBirth = (isoDate: string): string => {
  const parts = isoDate.split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : isoDate;
};

// We only reveal the child's data here — after custody has been confirmed — so the
// parent can see who the account is for and go back if the code was wrong. It's a
// presentation of the register data, not a yes/no question.
export const ChildConfirmStep: FC<ChildConfirmStepProps> = ({ child }) => (
  <section className="d-flex flex-column gap-4" key="child-confirm">
    <div className="d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.title" />
      </h2>
    </div>
    <div className="section-content">
      <dl className="card p-4 m-0 d-flex flex-column gap-3">
        <div className="d-flex justify-content-between gap-3">
          <dt className="fw-normal text-body-secondary m-0">
            <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.name" />
          </dt>
          <dd className="fw-medium text-end m-0">
            {child.firstName} {child.lastName}
          </dd>
        </div>
        <div className="d-flex justify-content-between gap-3">
          <dt className="fw-normal text-body-secondary m-0">
            <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.dateOfBirth" />
          </dt>
          <dd className="fw-medium text-end m-0">{formatDateOfBirth(child.dateOfBirth)}</dd>
        </div>
      </dl>
    </div>
  </section>
);
