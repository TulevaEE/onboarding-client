import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export const Maintenance: React.FC = () => {
  const { formatMessage } = useIntl();

  return (
    <>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <div className="material-icons">build</div>
      <div>
        <FormattedMessage
          id="login.epis_maintenance"
          values={{
            a: (chunks: React.ReactNode) => (
              <a href={formatMessage({ id: 'login.epis_maintenance.url' })}>{chunks}</a>
            ),
          }}
        />
      </div>
    </>
  );
};
