import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

export const RequirementsCheckStep: FC = () => (
  <section className="d-flex flex-column gap-4">
    <div className="section-header d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundCompanyOnboarding.requirementsCheckStep.title" />
      </h2>
      <p className="m-0">
        <FormattedMessage id="flows.savingsFundCompanyOnboarding.requirementsCheckStep.description" />
      </p>
    </div>
  </section>
);
