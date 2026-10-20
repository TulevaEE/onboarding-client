import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../common/usePageTitle';
import { ConnectedAppsSection } from './connectedApps/ConnectedAppsSection';

export const SecurityPage: FC = () => {
  usePageTitle('pageTitle.security');

  return (
    <div className="col-sm-10 col-md-8 col-lg-6 mx-auto mt-5">
      <h1 className="mb-5">
        <FormattedMessage id="security.title" />
      </h1>
      <ConnectedAppsSection />
    </div>
  );
};
