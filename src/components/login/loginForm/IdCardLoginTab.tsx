import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useWebEidAuth } from '../useWebEidAuth';

function isLegacyMtlsRequested(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('mtls') === 'true';
}

interface IdCardLoginTabProps {
  onAuthenticateWithIdCardMtls: () => void;
}

export const IdCardLoginTab: React.FC<IdCardLoginTabProps> = ({ onAuthenticateWithIdCardMtls }) => {
  const { authenticate, isLoading } = useWebEidAuth();

  const handleClick = () => {
    if (isLegacyMtlsRequested()) {
      onAuthenticateWithIdCardMtls();
    } else {
      authenticate();
    }
  };

  return (
    <div className="d-grid">
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" />
            <FormattedMessage id="login.enter" />
          </>
        ) : (
          <FormattedMessage id="login.enter" />
        )}
      </button>
    </div>
  );
};
