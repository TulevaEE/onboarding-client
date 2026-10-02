import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Loader } from '../../common';
import { SmartIdLoginFlow } from '../../common/apiModels';
import { useLoginLanguage } from '../loginLanguage';
import { useRememberedSmartIdAccount } from '../smartId/useRememberedSmartIdAccount';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { RememberMeCheckbox } from './RememberMeCheckbox';
import { readRememberMeChoice, saveRememberMeChoice } from './rememberMeChoice';

interface SmartIdLoginTabProps {
  onSmartIdLoginStart: (language: string, flow?: SmartIdLoginFlow, rememberMe?: boolean) => void;
}

export const SmartIdLoginTab: React.FC<SmartIdLoginTabProps> = ({ onSmartIdLoginStart }) => {
  const language = useLoginLanguage();
  const { account, loading, forget } = useRememberedSmartIdAccount();
  const [rememberMe, setRememberMe] = useState(readRememberMeChoice);

  const chooseRememberMe = (choice: boolean) => {
    saveRememberMeChoice(choice);
    setRememberMe(choice);
  };

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
            id="login.continue.as"
            values={{ firstName: <span className={PII_CLASS}>{account.firstName}</span> }}
          />
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-lg text-wrap text-balance"
          onClick={() => {
            saveRememberMeChoice(false);
            forget().then(() => onSmartIdLoginStart(language, 'DEVICE_LINK'));
          }}
        >
          <FormattedMessage id="login.not.you" />
        </button>
      </div>
    );
  }

  return (
    <div className="d-grid gap-3">
      <RememberMeCheckbox
        id="smart-id-remember-me"
        checked={rememberMe}
        onChange={chooseRememberMe}
      />
      <button
        type="button"
        className="btn btn-primary btn-lg text-wrap text-balance"
        onClick={() => onSmartIdLoginStart(language, 'DEVICE_LINK', rememberMe)}
      >
        <FormattedMessage id="login.enter" />
      </button>
    </div>
  );
};
