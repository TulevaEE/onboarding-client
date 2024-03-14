import config from 'react-global-configuration';
import { AuthenticationPrincipal } from './apiModels';

const AUTHENTICATION_CONFIGURATION_KEY = 'AUTHENTICATION_CONFIGURATION_KEY';
export function restoreAuthenticationFromSession(): void {
  if (window.sessionStorage) {
    const item = sessionStorage.getItem(AUTHENTICATION_CONFIGURATION_KEY);
    if (item) {
      const authenticationPrincipal = JSON.parse(item);
      setAuthenticationInConfiguration(authenticationPrincipal);
    }
  }
}

function updateSessionStorage(authentication: AuthenticationPrincipal) {
  if (window.sessionStorage) {
    sessionStorage.setItem(AUTHENTICATION_CONFIGURATION_KEY, JSON.stringify(authentication));
  } else {
    // eslint-disable-next-line no-console
    console.error('No session storage present');
  }
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
  if (window.sessionStorage) {
    sessionStorage.removeItem(AUTHENTICATION_CONFIGURATION_KEY);
  }
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

  const isAuthenticated = (): boolean => {
    return (
      authenticationPrincipal !== null &&
      authenticationPrincipal !== undefined &&
      !!authenticationPrincipal.accessToken
    );
  };

  return {
    ...authenticationPrincipal,
    update,
    remove,
    isAuthenticated,
  };
}
