import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Loader } from '../../common';
import { SmartIdLoginFlow } from '../../common/apiModels';
import { deviceClass } from '../../common/deviceClass';
import { useLoginLanguage } from '../loginLanguage';
import { useRememberedSmartIdAccount } from '../smartId/useRememberedSmartIdAccount';
import { IconBeforeLabel, QrCodeIcon, SmartIdMarkIcon } from '../smartId/icons';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { QuietLinkButton } from './QuietLink';
import { RememberMeCheckbox } from './RememberMeCheckbox';
import { readRememberMeChoice, saveRememberMeChoice } from './rememberMeChoice';
import { InAppBrowserSmartIdLogin } from './InAppBrowserSmartIdLogin';
import { wayOutOfTheInAppBrowser } from '../smartId/wayOutOfTheInAppBrowser';
import { PRIMARY_LOGIN_BUTTON_CLASS } from './loginButtonClasses';
import { usePrivateSafariTabOnAnIphone } from '../smartId/usePrivateSafariTabOnAnIphone';

interface SmartIdLoginTabProps {
  onSmartIdLoginStart: (
    language: string,
    flow?: SmartIdLoginFlow,
    rememberMe?: boolean,
    qrCodeRequested?: boolean,
  ) => void;
}

export const SmartIdLoginTab: React.FC<SmartIdLoginTabProps> = ({ onSmartIdLoginStart }) => {
  const { formatMessage } = useIntl();
  const language = useLoginLanguage();
  const { account, loading, pushLoginAvailable, forget } = useRememberedSmartIdAccount();
  const [rememberMe, setRememberMe] = useState(() => readRememberMeChoice() ?? false);
  const inAPrivateSafariTab = usePrivateSafariTabOnAnIphone();

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
          className={PRIMARY_LOGIN_BUTTON_CLASS}
          onClick={() => onSmartIdLoginStart(language, 'NOTIFICATION')}
        >
          <FormattedMessage
            id="login.continue.as"
            values={{ firstName: <span className={PII_CLASS}>{account.firstName}</span> }}
          />
        </button>
        <QuietLinkButton
          onClick={() => {
            chooseRememberMe(false);
            forget();
          }}
        >
          <FormattedMessage id="login.not.you" />
        </QuietLinkButton>
      </div>
    );
  }

  const onAPhone = deviceClass() === 'phone';
  const startLogin = () =>
    onSmartIdLoginStart(language, 'DEVICE_LINK', pushLoginAvailable && rememberMe);

  const wayOut = onAPhone ? wayOutOfTheInAppBrowser(navigator.userAgent) : null;

  if (wayOut) {
    return (
      <div className="d-grid gap-3">
        <InAppBrowserSmartIdLogin wayOut={wayOut} />
      </div>
    );
  }

  const logInButton = (
    <button type="button" className={PRIMARY_LOGIN_BUTTON_CLASS} onClick={startLogin}>
      <IconBeforeLabel
        icon={onAPhone ? <SmartIdMarkIcon /> : <QrCodeIcon />}
        label={formatMessage({ id: 'login.enter' })}
      />
    </button>
  );

  return (
    <div className="d-grid gap-3">
      {pushLoginAvailable && (
        <RememberMeCheckbox
          id="smart-id-remember-me"
          checked={rememberMe}
          onChange={chooseRememberMe}
        />
      )}
      {onAPhone ? (
        <div className="d-grid gap-2">
          {inAPrivateSafariTab && (
            <p className="m-0 text-pretty">
              <FormattedMessage id="login.smart.id.private.safari.tab" />
            </p>
          )}
          {logInButton}
          <QuietLinkButton
            onClick={() => onSmartIdLoginStart(language, 'DEVICE_LINK', false, true)}
          >
            <FormattedMessage id="login.smart.id.qr.show" />
          </QuietLinkButton>
        </div>
      ) : (
        logInButton
      )}
    </div>
  );
};
