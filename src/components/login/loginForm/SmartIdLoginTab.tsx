import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Loader } from '../../common';
import { SmartIdLoginFlow } from '../../common/apiModels';
import { useLoginLanguage } from '../loginLanguage';
import { useRememberedSmartIdAccount } from '../smartId/useRememberedSmartIdAccount';

interface SmartIdLoginTabProps {
  onSmartIdLoginStart: (language: string, flow?: SmartIdLoginFlow) => void;
}

export const SmartIdLoginTab: React.FC<SmartIdLoginTabProps> = ({ onSmartIdLoginStart }) => {
  const language = useLoginLanguage();
  const { account, loading, forget } = useRememberedSmartIdAccount();

  if (loading) {
    return <Loader className="align-middle" />;
  }

  if (account) {
    return (
      <>
        <p className="m-0 mb-3 text-body-secondary">
          <FormattedMessage id="login.smart.id.push.intro" />
        </p>
        <div className="d-grid">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onSmartIdLoginStart(language, 'NOTIFICATION')}
          >
            <FormattedMessage
              id="login.smart.id.continue.as"
              values={{ firstName: account.firstName }}
            />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-link mt-3"
          onClick={() => forget().then(() => onSmartIdLoginStart(language, 'DEVICE_LINK'))}
        >
          <FormattedMessage id="login.smart.id.not.you" />
        </button>
      </>
    );
  }

  return (
    <>
      <p className="m-0 mb-3 text-body-secondary">
        <FormattedMessage id="login.smart.id.intro" />
      </p>
      <div className="d-grid">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => onSmartIdLoginStart(language, 'DEVICE_LINK')}
        >
          <FormattedMessage id="login.smart.id.start" />
        </button>
      </div>
    </>
  );
};
