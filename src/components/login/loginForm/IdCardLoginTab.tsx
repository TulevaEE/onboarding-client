import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useWebEidAuth } from '../useWebEidAuth';
import { ErrorAlert } from '../../common';

function isWebEidEnabled(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('webeid') === 'true';
}

interface IdCardLoginTabProps {
  onAuthenticateWithIdCardMtls: () => void;
}

export const IdCardLoginTab: React.FC<IdCardLoginTabProps> = ({ onAuthenticateWithIdCardMtls }) => {
  const { authenticate, isLoading, error, reset } = useWebEidAuth();
  const useWebEid = isWebEidEnabled();

  const handleClick = () => {
    if (useWebEid) {
      reset();
      authenticate();
    } else {
      onAuthenticateWithIdCardMtls();
    }
  };

  return (
    <div className="d-grid">
      {error && <ErrorAlert description={error} />}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            <FormattedMessage id="login.enter" />
          </>
        ) : (
          <FormattedMessage id="login.enter" />
        )}
      </button>
    </div>
  );
};
