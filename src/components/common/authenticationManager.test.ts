import config from 'react-global-configuration';
import { AuthenticationPrincipal } from './apiModels';
import * as authenticationManagerModule from './authenticationManager';
import { anAuthenticationManager } from './authenticationManagerFixture';

jest.mock('react-global-configuration');

describe('Authentication Management', () => {
  const AUTHENTICATION_CONFIGURATION_KEY = 'AUTHENTICATION_CONFIGURATION_KEY';
  const mockAuthentication: AuthenticationPrincipal = {
    accessToken: anAuthenticationManager().accessToken,
    refreshToken: anAuthenticationManager().refreshToken,
    loginMethod: anAuthenticationManager().loginMethod,
    signingMethod: anAuthenticationManager().signingMethod,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSessionStorage = {
      getItem: jest.fn().mockImplementation((key) => {
        if (key === AUTHENTICATION_CONFIGURATION_KEY) {
          return JSON.stringify(mockAuthentication);
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('restoreAuthenticationFromSession should restore data when session storage has authentication', () => {
    authenticationManagerModule.restoreAuthenticationFromSession();
    expect(config.set).toHaveBeenCalledWith(
      { [AUTHENTICATION_CONFIGURATION_KEY]: mockAuthentication },
      { freeze: false, assign: true },
    );
  });

  test('update method should update session storage with new authentication data', () => {
    const mockAuthData = anAuthenticationManager('newAccessToken');
    const authManager = authenticationManagerModule.getAuthentication();
    authManager.update(mockAuthData);

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      AUTHENTICATION_CONFIGURATION_KEY,
      JSON.stringify(mockAuthData),
    );
  });

  test('remove method should remove authentication from session storage', () => {
    const authManager = authenticationManagerModule.getAuthentication();
    authManager.remove();

    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(AUTHENTICATION_CONFIGURATION_KEY);
  });

  test('isAuthenticated should return true when access token is present', () => {
    (config.get as jest.Mock).mockImplementation(() => mockAuthentication);
    const authManager = authenticationManagerModule.getAuthentication();
    expect(authManager.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated should return false when access token is not present', () => {
    (config.get as jest.Mock).mockImplementation(() => ({}));
    const authManager = authenticationManagerModule.getAuthentication();
    expect(authManager.isAuthenticated()).toBe(false);
  });
});
