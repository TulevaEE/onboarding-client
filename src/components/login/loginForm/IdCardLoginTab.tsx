import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useWebEidAuth } from '../useWebEidAuth';

export const IdCardLoginTab: React.FC = () => {
  const { authenticate, isLoading } = useWebEidAuth();

  return (
    <div className="d-grid">
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={() => authenticate()}
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
