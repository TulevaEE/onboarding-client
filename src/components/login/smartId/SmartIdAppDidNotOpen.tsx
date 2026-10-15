import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { inBraveOnAndroid, inSamsungInternet } from '../../common/browserFamily';

const SAMSUNG_INTERNET_LABELS = {
  et: { privacy: 'Privaatsus', block: 'Blokeeri avanevad välised rakendused' },
  en: { privacy: 'Privacy', block: 'Block opening external apps' },
};

const BRAVE_LABELS = {
  et: {
    settings: 'Seaded',
    shields: "Brave'i kaitsed ja privaatsus",
    appLinks: "Luba rakenduse linkide avamine Brave'i välistes rakendustes",
  },
  en: {
    settings: 'Settings',
    shields: 'Brave Shields & privacy',
    appLinks: 'Allow app links to open in apps outside of Brave',
  },
};

const languageOfThePhone = (): 'et' | 'en' => (navigator.language.startsWith('et') ? 'et' : 'en');

const SettingThatKeepsTheAppClosed: React.FC = () => {
  if (inBraveOnAndroid()) {
    return (
      <p className="m-0">
        <FormattedMessage
          id="login.smart.id.app.kept.closed.by.brave"
          values={BRAVE_LABELS[languageOfThePhone()]}
        />
      </p>
    );
  }
  if (inSamsungInternet()) {
    return (
      <p className="m-0">
        <FormattedMessage
          id="login.smart.id.app.kept.closed.by.samsung.internet"
          values={SAMSUNG_INTERNET_LABELS[languageOfThePhone()]}
        />
      </p>
    );
  }
  return null;
};

export const SmartIdAppDidNotOpen: React.FC = () => {
  const { formatMessage } = useIntl();

  return (
    <div className="d-grid gap-2 text-pretty">
      <p className="m-0">
        <FormattedMessage id="login.smart.id.app.did.not.open" />
      </p>
      <SettingThatKeepsTheAppClosed />
      <p className="m-0">
        <FormattedMessage
          id="login.smart.id.app.on.another.device"
          values={{
            cancel: formatMessage({ id: 'login.stop' }),
            showQrCode: formatMessage({ id: 'login.smart.id.qr.show' }),
          }}
        />
      </p>
    </div>
  );
};
