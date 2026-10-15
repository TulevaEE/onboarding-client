import React from 'react';
import { FormattedMessage } from 'react-intl';

const SAFARI_VERSION = /Version\/(\d+)/;
const SAFARI_WITH_NEW_TAB_UNDER_THE_MORE_BUTTON = 26;

const safariVersion = (): number | null => {
  const version = SAFARI_VERSION.exec(navigator.userAgent);
  return version ? Number(version[1]) : null;
};

export const PrivateSafariTabInstruction: React.FC = () => (
  <FormattedMessage
    id={
      safariVersion() === SAFARI_WITH_NEW_TAB_UNDER_THE_MORE_BUTTON
        ? 'login.smart.id.private.safari.tab.more.button'
        : 'login.smart.id.private.safari.tab'
    }
  />
);
