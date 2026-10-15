import config from 'react-global-configuration';
import { AuthenticationPrincipal } from './apiModels';
import { withSessionStorage } from './siteStorage';

const AUTHENTICATION_CONFIGURATION_KEY = 'AUTHENTICATION_CONFIGURATION_KEY';
export function restoreAuthenticationFromSession(): void {
  const item = withSessionStorage(
    (storage) => storage.getItem(AUTHENTICATION_CONFIGURATION_KEY),
    null,
  );
  if (item) {
    const authenticationPrincipal = JSON.parse(item);
    setAuthenticationInConfiguration(authenticationPrincipal);
  }
}

function updateSessionStorage(authentication: AuthenticationPrincipal) {
  withSessionStorage(
    (storage) => storage.setItem(AUTHENTICATION_CONFIGURATION_KEY, JSON.stringify(authentication)),
    undefined,
  );
}

function setAuthenticationInConfiguration(newAuthentication: AuthenticationPrincipal) {
  config.set(
    {
      [AUTHENTICATION_CONFIGURATION_KEY]: newAuthentication,
    },
    { freeze: false, assign: true },
  );
}

function removeAuthenticationInConfiguration() {
  config.set(
    {
      [AUTHENTICATION_CONFIGURATION_KEY]: undefined,
    },
    { freeze: false, assign: true },
  );
}

function removeAuthenticationFromSessionStorage() {
  withSessionStorage((storage) => storage.removeItem(AUTHENTICATION_CONFIGURATION_KEY), undefined);
}
export interface AuthenticationManager extends AuthenticationPrincipal {
  update: (authentication: AuthenticationPrincipal) => void;
  remove: () => void;
  isAuthenticated: () => boolean;
}

export function getAuthentication(): AuthenticationManager {
  const update = (newAuthentication: AuthenticationManager): void => {
    setAuthenticationInConfiguration(newAuthentication);
    updateSessionStorage(newAuthentication);
  };

  const remove = (): void => {
    removeAuthenticationFromSessionStorage();
    removeAuthenticationInConfiguration();
  };

  const authenticationPrincipal = config.get(AUTHENTICATION_CONFIGURATION_KEY) || {};

  const isAuthenticated = (): boolean =>
    authenticationPrincipal !== null &&
    authenticationPrincipal !== undefined &&
    !!authenticationPrincipal.accessToken;

  return {
    ...authenticationPrincipal,
    update,
    remove,
    isAuthenticated,
  };
}

export const isSigningWithIdCard = (): boolean => getAuthentication().signingMethod === 'ID_CARD';
