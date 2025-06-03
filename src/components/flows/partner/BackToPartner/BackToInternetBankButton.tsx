import config from 'react-global-configuration';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import { EXTERNAL_AUTHENTICATOR_REDIRECT_URI } from '../../../TriggerProcedure/utils';

export const BackToInternetBankButton: React.FC = () => {
  const redirectUri = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI);
  return (
    <>
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !(window as any).ReactNativeWebView && redirectUri ? (
          <div className="d-flex justify-content-center mt-2">
            <a href={`${redirectUri}i/deposits?lang=${config.get('language')}`}>
              <FormattedMessage id="success.backButton" />
            </a>
          </div>
        ) : (
          ''
        )
      }
    </>
  );
};
