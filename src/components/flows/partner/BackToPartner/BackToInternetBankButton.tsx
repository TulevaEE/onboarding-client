import config from 'react-global-configuration';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import { isInPartnerApp, partnerInternetBank } from '../../../TriggerProcedure/utils';

export const BackToInternetBankButton: React.FC = () => {
  const internetBank = partnerInternetBank();
  if (isInPartnerApp() || !internetBank) {
    return null;
  }
  return (
    <div className="d-flex justify-content-center mt-2">
      <a href={new URL(`i/pension?lang=${config.get('language')}`, internetBank).href}>
        <FormattedMessage id="success.backButton" />
      </a>
    </div>
  );
};
