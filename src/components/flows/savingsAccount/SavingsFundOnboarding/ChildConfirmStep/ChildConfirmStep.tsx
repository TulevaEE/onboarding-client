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

export const ChildConfirmStep: FC<ChildConfirmStepProps> = ({ child }) => (
  <section className="d-flex flex-column gap-4" key="child-confirm">
    <div className="d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.title" />
      </h2>
    </div>
    <div className="section-content">
      <div className="card p-4 d-flex flex-row justify-content-between gap-3">
        <span className="text-body-secondary">
          <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.childLabel" />
        </span>
        <span className="fw-medium text-end">
          {child.firstName} {child.lastName}
          {' · '}
          <FormattedMessage id="flows.savingsFundChildOnboarding.confirmStep.born" />{' '}
          {formatDateOfBirth(child.dateOfBirth)}
        </span>
      </div>
    </div>
  </section>
);
