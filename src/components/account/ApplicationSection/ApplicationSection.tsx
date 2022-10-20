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
      {applications
        .sort((application1, application2) =>
          application2.creationTime.localeCompare(application1.creationTime),
        )
        .map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            allowedActions={[ApplicationAction.CANCEL]}
          />
        ))}
    </section>
  ) : (
    <></>
  );
};
