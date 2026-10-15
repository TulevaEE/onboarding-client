import config from 'react-global-configuration';
import { AuthenticationPrincipal } from './apiModels';
import * as authenticationManagerModule from './authenticationManager';
import { anAuthenticationManager } from './authenticationManagerFixture';
import { blockSiteStorage } from '../../test/siteStorage';

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

  describe('when the browser blocks session storage', () => {
    let unblockSiteStorage: () => void;

    beforeEach(() => {
      unblockSiteStorage = blockSiteStorage();
    });

    afterEach(() => unblockSiteStorage());

    test('restoreAuthenticationFromSession restores nothing', () => {
      authenticationManagerModule.restoreAuthenticationFromSession();

      expect(config.set).not.toHaveBeenCalled();
    });

    test('update keeps the authentication for this page', () => {
      const mockAuthData = anAuthenticationManager('newAccessToken');

      authenticationManagerModule.getAuthentication().update(mockAuthData);

      expect(config.set).toHaveBeenCalledWith(
        { [AUTHENTICATION_CONFIGURATION_KEY]: mockAuthData },
        { freeze: false, assign: true },
      );
    });

    test('remove forgets the authentication of this page', () => {
      authenticationManagerModule.getAuthentication().remove();

      expect(config.set).toHaveBeenCalledWith(
        { [AUTHENTICATION_CONFIGURATION_KEY]: undefined },
        { freeze: false, assign: true },
      );
    });
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

  test.each([
    ['ID_CARD', true],
    ['SMART_ID', false],
    ['MOBILE_ID', false],
  ])('isSigningWithIdCard for a %s session is %s', (signingMethod, expected) => {
    (config.get as jest.Mock).mockReturnValue({ ...mockAuthentication, signingMethod });

    expect(authenticationManagerModule.isSigningWithIdCard()).toBe(expected);
  });
});
