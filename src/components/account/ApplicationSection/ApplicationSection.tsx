import React from 'react';

import { FormattedMessage } from 'react-intl';
import { useMe, usePendingApplications } from '../../common/apiHooks';
import { ApplicationCard } from './ApplicationCards';

export const ApplicationSection: React.FunctionComponent = () => {
  const { data: applications } = usePendingApplications();
  const { data: user } = useMe();
  const filteredApplications = applications?.filter(
    (application) =>
      !(
        application.type === 'PAYMENT_RATE' &&
        application.details.paymentRate === user?.secondPillarPaymentRates.current
      ),
  );
  return filteredApplications && filteredApplications.length ? (
    <section className="mt-5">
      <h2 className="mb-4 lead">
        <FormattedMessage id="applications.title" />
      </h2>
      {filteredApplications
        .sort((application1, application2) =>
          application2.creationTime.localeCompare(application1.creationTime),
        )
        .map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            allowedActions={['CANCEL']}
          />
        ))}
    </section>
  ) : (
    <></>
  );
};
