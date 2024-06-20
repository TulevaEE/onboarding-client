import React from 'react';
import { FormattedMessage } from 'react-intl';

export const StatusBoxTitle: React.FunctionComponent = () => (
  <div className="row">
    <div className="col-md-6 mb-4 lead">
      <FormattedMessage id="account.status.choices" />
    </div>
  </div>
);
