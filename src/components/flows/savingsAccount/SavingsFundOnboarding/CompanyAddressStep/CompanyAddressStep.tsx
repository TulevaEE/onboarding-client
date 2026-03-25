import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

export const CompanyAddressStep: FC = () => (
  <section className="d-flex flex-column gap-4">
    <div className="d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.companyAddressStep.title" />
      </h2>
      <p className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.companyAddressStep.description" />
      </p>
    </div>
  </section>
);
