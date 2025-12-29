import React from 'react';
import { FormattedMessage } from 'react-intl';

export const Maintenance: React.FC = () => (
  <>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    <div className="material-icons">build</div>
    <div>
      <FormattedMessage id="login.epis_maintenance" />
    </div>
  </>
);
