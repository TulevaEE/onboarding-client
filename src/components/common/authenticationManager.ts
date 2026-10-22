import config from 'react-global-configuration';
import { AuthenticationPrincipal } from './apiModels';
import { isSessionStorageBlocked, withSessionStorage } from './siteStorage';
import { parseJwt } from './jwt';

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
  if (isSessionStorageBlocked() || !window.sessionStorage) {
    return;
  }
  window.sessionStorage.setItem(AUTHENTICATION_CONFIGURATION_KEY, JSON.stringify(authentication));
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

export function loginTimeOf(accessToken: string | undefined): number | null {
  if (!accessToken) {
    return null;
  }
  try {
    const loginTime = Date.parse(parseJwt(accessToken).attributes.authTime);
    return Number.isNaN(loginTime) ? null : loginTime;
  } catch (error) {
    return null;
  }
}
