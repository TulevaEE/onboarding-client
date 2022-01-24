import React from 'react';

import { FormattedMessage } from 'react-intl';
import { usePendingApplications } from '../../common/apiHooks';
import { ApplicationAction, ApplicationCard } from './ApplicationCards';

export const ApplicationSection: React.FunctionComponent = () => {
  const { data: applications } = usePendingApplications();
  return applications && applications.length ? (
    <section className="mt-5">
      <h2 className="mb-4 lead">
        <FormattedMessage id="applications.title" />
      </h2>
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          allowedActions={[ApplicationAction.CANCEL]}
        />
      ))}
      <div className="mt-2">
        <small className="text-muted">
          <FormattedMessage id="applications.footer" />
        </small>
      </div>
    </section>
  ) : (
    <></>
  );
};
