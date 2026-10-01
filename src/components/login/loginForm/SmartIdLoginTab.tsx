import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Loader } from '../../common';
import { SmartIdLoginFlow } from '../../common/apiModels';
import { useLoginLanguage } from '../loginLanguage';
import { useRememberedSmartIdAccount } from '../smartId/useRememberedSmartIdAccount';
import { PII_CLASS } from '../../tracking/piiMarkup';

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
      <div className="d-grid gap-2">
        <button
          type="button"
          className="btn btn-primary btn-lg text-wrap text-balance"
          onClick={() => onSmartIdLoginStart(language, 'NOTIFICATION')}
        >
          <FormattedMessage
            id="login.smart.id.continue.as"
            values={{ firstName: <span className={PII_CLASS}>{account.firstName}</span> }}
          />
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-lg text-wrap text-balance"
          onClick={() => forget().then(() => onSmartIdLoginStart(language, 'DEVICE_LINK'))}
        >
          <FormattedMessage id="login.smart.id.not.you" />
        </button>
      </div>
    );
  }

  return (
    <div className="d-grid">
      <button
        type="button"
        className="btn btn-primary btn-lg text-wrap text-balance"
        onClick={() => onSmartIdLoginStart(language, 'DEVICE_LINK')}
      >
        <FormattedMessage id="login.smart.id.start" />
      </button>
    </div>
  );
};
