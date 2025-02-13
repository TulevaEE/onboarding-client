import React from 'react';
import { FormattedMessage } from 'react-intl';

export const StatusBoxTitle: React.FunctionComponent = () => (
  <h2 className="mt-5 mb-4">
    <FormattedMessage id="account.status.choices" />
  </h2>
);
