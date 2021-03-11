import React from 'react';
import { Message } from 'retranslate';

import { usePendingApplications } from '../../common/apiHooks';
import { ApplicationAction, ApplicationCard } from './ApplicationCards';

export const ApplicationSection: React.FunctionComponent = () => {
  const { data: applications } = usePendingApplications();
  return applications && applications.length ? (
    <section className="mt-5">
      <h2 className="mb-4 lead">
        <Message>applications.title</Message>
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
          <Message>applications.footer</Message>
        </small>
      </div>
    </section>
  ) : (
    <></>
  );
};
