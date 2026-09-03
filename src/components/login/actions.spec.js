import config from 'react-global-configuration';

import {
  CHANGE_PHONE_NUMBER,
  CHANGE_EMAIL,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  SMART_ID_LOGIN_START_SUCCESS,
  MOBILE_AUTHENTICATION_CANCEL,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START_SUCCESS,
  ID_CARD_AUTHENTICATION_START_ERROR,
  ID_CARD_AUTHENTICATION_ERROR,
  ID_CARD_AUTHENTICATION_SUCCESS,
  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  GET_USER_CONVERSION_START,
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_CONVERSION_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
  CHANGE_PERSONAL_CODE,
} from './constants';

import { ID_CARD_LOGIN_START_FAILED_ERROR } from '../common/errorAlert/ErrorAlert';
import { getAuthentication } from '../common/authenticationManager';
import {
  rememberMobileIdPhoneNumber,
  rememberedMobileIdPhoneNumber,
} from './mobileId/rememberedPhoneNumbers';

const mockHttp = jest.genMockFromModule('../common/http');
jest.mock('../common/http', () => mockHttp);

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Login actions', () => {
  const web2AppLink =
    'https://smart-id.com/device-link/?deviceLinkType=Web2App&sessionType=auth&lang=est';
  const desktopUserAgent = navigator.userAgent;

  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: {} };
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
    config.set({}, { freeze: false, assign: false });
    mockDispatch();
    mockApi.authenticateWithMobileId = () => Promise.reject();
    mockApi.authenticateWithSmartId = () => Promise.reject();
    mockApi.startSmartIdLogin = () => Promise.reject();
    mockApi.getMobileIdTokens = () => Promise.reject();
    mockApi.getSmartIdTokens = () => Promise.reject();
    mockApi.getIdCardTokens = () => Promise.reject();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: desktopUserAgent,
      configurable: true,
    });
  });

  it('never writes tokens to the console while polling', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const tokens = { accessToken: 'a secret access token', refreshToken: 'a secret refresh token' };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    await createBoundAction(actions.startSmartIdLogin)('et');

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const logged = consoleLog.mock.calls.flat().map(String).join(' ');
    expect(logged).not.toContain('a secret access token');
    expect(logged).not.toContain('a secret refresh token');
    consoleLog.mockRestore();
  });

  it('can change mobile identity code', () => {
    const personalCode = '50001018865';
    const action = actions.changePersonalCode(personalCode);
    expect(action).toEqual({
      personalCode,
      type: CHANGE_PERSONAL_CODE,
    });
  });

  it('can change phone number', () => {
    const phoneNumber = '12312312312';
    const action = actions.changePhoneNumber(phoneNumber);
    expect(action).toEqual({
      phoneNumber,
      type: CHANGE_PHONE_NUMBER,
    });
  });

  it('can change email', () => {
    const email = 'an@email.it';
    const action = actions.changeEmail(email);
    expect(action).toEqual({
      email,
      type: CHANGE_EMAIL,
    });
  });

  it('can authenticate with a phone number', () => {
    const phoneNumber = '12345';
    const controlCode = '1337';
    mockApi.authenticateWithMobileId = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.resolve(controlCode);
    });
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);
    expect(dispatch).not.toHaveBeenCalled();
    return authenticateWithMobileId(phoneNumber).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(2); // calls next action to start polling as well.
      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_START_SUCCESS,
        controlCode,
      });
    });
  });

  it('can authenticate with an id card (mTLS)', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithIdCardMtls = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.resolve();
    });
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    expect(dispatch).not.toHaveBeenCalled();
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(tokens));
    return authenticateWithIdCard().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START_SUCCESS,
      });
    });
  });

  it('can handle id card login with query parameter', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    const handleIdCardLogin = createBoundAction(actions.handleIdCardLogin);
    expect(dispatch).not.toHaveBeenCalled();
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(tokens));

    handleIdCardLogin({ login: 'ID_CARD' });

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith({
      type: ID_CARD_AUTHENTICATION_START,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ID_CARD_AUTHENTICATION_START_SUCCESS,
    });
  });

  it('thunk uses mTLS and never calls WebEid api regardless of ?webeid=true flag', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?webeid=true' },
      writable: true,
      configurable: true,
    });

    mockApi.authenticateWithIdCardMtls = jest.fn(() => Promise.resolve());
    mockApi.authenticateWithIdCardWebEid = jest.fn(() =>
      Promise.resolve({ accessToken: 't', refreshToken: 'r' }),
    );
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);

    return authenticateWithIdCard().then(() => {
      expect(mockApi.authenticateWithIdCardMtls).toHaveBeenCalled();
      expect(mockApi.authenticateWithIdCardWebEid).not.toHaveBeenCalled();
    });
  });

  it('can handle authenticate with an id card start error (mTLS)', () => {
    const initialError = new Error('oh no!');
    const actualBroadcastedError = {
      body: { errors: [{ code: ID_CARD_LOGIN_START_FAILED_ERROR }] },
    };

    mockApi.authenticateWithIdCardMtls = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.reject(initialError);
    });
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    expect(dispatch).not.toHaveBeenCalled();
    return authenticateWithIdCard().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START_ERROR,
        error: actualBroadcastedError,
      });
    });
  });

  it('starts polling until succeeds when authenticating with a phone number', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithMobileId = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);
    return authenticateWithMobileId('')
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdTokens = jest.fn(() => Promise.resolve(tokens));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdTokens).toHaveBeenCalled();
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: MOBILE_AUTHENTICATION_SUCCESS,
          tokens,
          method: 'MOBILE_ID',
        });
      });
  });

  it('remembers the phone number only after a mobile id login succeeds', () => {
    localStorage.clear();
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithMobileId = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdTokens = jest.fn(() => Promise.resolve(tokens));
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);

    return authenticateWithMobileId('+37255512345', '38888888888', true).then(() => {
      expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
      jest.runOnlyPendingTimers();
      return Promise.resolve().then(() => {
        expect(rememberedMobileIdPhoneNumber('38888888888')).toBe('+37255512345');
      });
    });
  });

  it('forgets a previously remembered phone number when the user opts out', () => {
    localStorage.clear();
    rememberMobileIdPhoneNumber('38888888888', '+37255500000');
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithMobileId = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdTokens = jest.fn(() => Promise.resolve(tokens));
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);

    return authenticateWithMobileId('+37255512345', '38888888888', false).then(() => {
      jest.runOnlyPendingTimers();
      return Promise.resolve().then(() => {
        expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
      });
    });
  });

  it('starts polling until fails when authenticating with a phone number', () => {
    const error = new Error('oh no!');
    mockApi.authenticateWithMobileId = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);
    return authenticateWithMobileId('123123')
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdTokens = jest.fn(() => Promise.reject(error));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdTokens).toHaveBeenCalled();
      })
      .then(() => {
        jest.runOnlyPendingTimers();
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: MOBILE_AUTHENTICATION_ERROR,
          error,
        });
      });
  });

  it('starts a smart id session in the current language and shares the device link', async () => {
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('en');

    expect(mockApi.startSmartIdLogin).toHaveBeenCalledWith('en', 'DEVICE_LINK');
    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
    expect(dispatch).toHaveBeenCalledWith({ type: SMART_ID_LOGIN_START_SUCCESS, web2AppLink });
  });

  it('opens the Smart-ID app right away on a phone', async () => {
    const assign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign, search: '', pathname: '/login' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');

    expect(assign).toHaveBeenCalledWith(web2AppLink);
  });

  it('leaves the browser alone when the session starts on a computer', async () => {
    const assign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign, search: '', pathname: '/login' },
      writable: true,
      configurable: true,
    });
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');

    expect(assign).not.toHaveBeenCalled();
  });

  it('shows the control code and polls when the remembered account is pushed a notification', async () => {
    const assign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign, search: '', pathname: '/login' },
      writable: true,
      configurable: true,
    });
    mockApi.startSmartIdLogin = jest.fn(() =>
      Promise.resolve({ flow: 'NOTIFICATION', web2AppLink: null, verificationCode: '4321' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et', 'NOTIFICATION');

    expect(mockApi.startSmartIdLogin).toHaveBeenCalledWith('et', 'NOTIFICATION');
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START_SUCCESS,
      controlCode: '4321',
    });
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SMART_ID_LOGIN_START_SUCCESS }),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('resumes a pending push login with its control code after a page reload', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() =>
      Promise.resolve({ flow: 'NOTIFICATION', web2AppLink: null, verificationCode: '4321' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    await createBoundAction(actions.startSmartIdLogin)('et', 'NOTIFICATION');

    mockDispatch();
    createBoundAction(actions.resumePendingSmartIdAuthentication)();

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START_SUCCESS,
      controlCode: '4321',
    });
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SMART_ID_LOGIN_START_SUCCESS }),
    );
  });

  it('remembers where the login was headed', async () => {
    state = { login: {}, router: { location: { state: { from: '/capital/listings/42' } } } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');

    expect(actions.getPendingSmartIdReturnPath()).toBe('/capital/listings/42');
  });

  it('has no destination to remember for a login started from the login page', async () => {
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');

    expect(actions.getPendingSmartIdReturnPath()).toBe(null);
  });

  it('does not resume on the smart id callback route', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/login/smart-id/callback' },
      writable: true,
      configurable: true,
    });
    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('reports a failure to start a smart id session', async () => {
    const error = { status: 401, body: { errors: [{ code: 'smart.id.technical.error' }] } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.reject(error));
    mockApi.getSmartIdTokens = jest.fn();
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
    expect(mockApi.getSmartIdTokens).not.toHaveBeenCalled();
  });

  it('stops polling when the smart id login is canceled', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const poll = jest.fn(() => new Promise(() => {}));
    mockApi.getSmartIdTokens = poll;
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    expect(poll).toHaveBeenCalledTimes(1);

    expect(actions.cancelMobileAuthentication()).toEqual({ type: MOBILE_AUTHENTICATION_CANCEL });

    jest.runOnlyPendingTimers();
    expect(poll).toHaveBeenCalledTimes(1);
    expect(poll.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('completes a smart id login started from the device link callback', async () => {
    const callback = {
      value: 'a-callback-value',
      sessionSecretDigest: 'a-digest',
      userChallengeVerifier: 'a-verifier',
    };
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.completeSmartIdCallback = jest.fn(() => Promise.resolve());
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    const completeSmartIdLogin = createBoundAction(actions.completeSmartIdLogin);

    await completeSmartIdLogin(callback);
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.completeSmartIdCallback).toHaveBeenCalledWith(callback);
    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it('reports a rejected device link callback', async () => {
    const error = { status: 401, body: { errors: [{ code: 'smart.id.callback.invalid' }] } };
    mockApi.completeSmartIdCallback = jest.fn(() => Promise.reject(error));
    mockApi.getSmartIdTokens = jest.fn();
    const completeSmartIdLogin = createBoundAction(actions.completeSmartIdLogin);

    await completeSmartIdLogin({
      value: 'a-callback-value',
      sessionSecretDigest: 'a-digest',
      userChallengeVerifier: 'a-verifier',
    });

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
    expect(mockApi.getSmartIdTokens).not.toHaveBeenCalled();
  });

  it('starts polling until succeeds when authenticating with smart id', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(null));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    return startSmartIdLogin('et')
      .then(() => {
        dispatch.mockClear();
        mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getSmartIdTokens).toHaveBeenCalled();
      })
      .then(async () => {
        jest.runOnlyPendingTimers();
        return Promise.resolve();
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: MOBILE_AUTHENTICATION_SUCCESS,
          tokens,
          method: 'SMART_ID',
        });
      });
  });

  it('recovers with a fresh smart id login attempt after a poll request never settles', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const strandedPoll = jest.fn(() => new Promise(() => {}));
    mockApi.getSmartIdTokens = strandedPoll;
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    expect(strandedPoll).toHaveBeenCalledTimes(1);

    actions.cancelMobileAuthentication();
    expect(strandedPoll.mock.calls[0][0].signal.aborted).toBe(true);

    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.getSmartIdTokens).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it.each([
    ['visibilitychange', () => document.dispatchEvent(new Event('visibilitychange'))],
    ['pageshow', () => window.dispatchEvent(new Event('pageshow'))],
  ])(
    'polls immediately on %s during a pending smart id login',
    async (eventName, dispatchBrowserEvent) => {
      state = { login: { loadingAuthentication: true } };
      mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
      const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
      mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
      const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

      await startSmartIdLogin('et');
      dispatchBrowserEvent();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockApi.getSmartIdTokens).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_SUCCESS,
        tokens,
        method: 'SMART_ID',
      });
    },
  );

  it('ignores a late authenticate response from a canceled smart id attempt', async () => {
    state = { login: { loadingAuthentication: true } };
    let resolveFirstStart;
    mockApi.startSmartIdLogin = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFirstStart = resolve;
        }),
    );
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    const firstAttempt = startSmartIdLogin('et');

    actions.cancelMobileAuthentication();

    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    await startSmartIdLogin('et');

    resolveFirstStart({ web2AppLink: 'https://smart-id.com/device-link/?stale' });
    await firstAttempt;

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.getSmartIdTokens).toHaveBeenCalledTimes(1);
    expect(mockApi.getSmartIdTokens).toHaveBeenCalledWith(expect.anything());
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it('resumes a pending smart id login after a page reload', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    mockDispatch();
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
    expect(dispatch).toHaveBeenCalledWith({ type: SMART_ID_LOGIN_START_SUCCESS, web2AppLink });

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.getSmartIdTokens).toHaveBeenCalledWith(expect.anything());
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it.each([
    ['Load failed'],
    ['Failed to fetch'],
    ['NetworkError when attempting to fetch resource.'],
  ])('keeps polling after a transient network error: %s', async (message) => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest
      .fn()
      .mockRejectedValueOnce(new TypeError(message))
      .mockResolvedValueOnce(tokens);
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: MOBILE_AUTHENTICATION_ERROR }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it('keeps the pending login resumable after a transient network error', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    mockDispatch();
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
  });

  it('still starts polling when session storage writes fail', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
      await startSmartIdLogin('et');
      jest.runOnlyPendingTimers();

      expect(dispatch).toHaveBeenCalledWith({
        type: SMART_ID_LOGIN_START_SUCCESS,
        web2AppLink,
      });
      expect(mockApi.getSmartIdTokens).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: MOBILE_AUTHENTICATION_START_ERROR }),
      );
    } finally {
      setItem.mockRestore();
    }
  });

  it('does not resume while another authentication flow is already running', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    mockDispatch();
    state = { login: { loadingAuthentication: true } };
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not resume when the user is already authenticated and drops the pending login', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    getAuthentication().update({
      accessToken: 'partner-token',
      refreshToken: 'partner-refresh',
      loginMethod: 'PARTNER',
      signingMethod: 'PARTNER',
    });
    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();
    getAuthentication().remove();
    resume();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not resume on the partner handover route', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/trigger-procedure' },
      writable: true,
      configurable: true,
    });
    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not resume a stale pending smart id login', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    jest.advanceTimersByTime(181000);

    mockDispatch();
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();
    jest.runOnlyPendingTimers();

    expect(dispatch).not.toHaveBeenCalled();
    expect(mockApi.getSmartIdTokens).not.toHaveBeenCalled();
  });

  it('does not resume once the login has completed', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });

    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();
    jest.runOnlyPendingTimers();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not resume a canceled smart id login', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);
    await startSmartIdLogin('et');

    actions.cancelMobileAuthentication();

    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();
    jest.runOnlyPendingTimers();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('abandons a stuck poll request and retries immediately when the tab becomes visible', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.startSmartIdLogin = jest.fn(() => Promise.resolve({ web2AppLink }));
    const strandedPoll = jest.fn(() => new Promise(() => {}));
    mockApi.getSmartIdTokens = strandedPoll;
    const startSmartIdLogin = createBoundAction(actions.startSmartIdLogin);

    await startSmartIdLogin('et');
    jest.runOnlyPendingTimers();
    expect(strandedPoll).toHaveBeenCalledTimes(1);

    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(strandedPoll.mock.calls[0][0].signal.aborted).toBe(true);
    expect(mockApi.getSmartIdTokens).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it('starts polling until succeeds when authenticating with id card (mTLS)', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithIdCardMtls = jest.fn(() => Promise.resolve());
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    return authenticateWithIdCard()
      .then(() => {
        dispatch.mockClear();
        mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(tokens));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getIdCardTokens).toHaveBeenCalled();
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: ID_CARD_AUTHENTICATION_SUCCESS,
          tokens,
        });
      });
  });

  it('starts polling until fails when authenticating with id card (mTLS)', () => {
    const error = new Error('oh no!');
    mockApi.authenticateWithIdCardMtls = jest.fn(() => Promise.resolve());
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    return authenticateWithIdCard()
      .then(() => {
        dispatch.mockClear();
        mockApi.getIdCardTokens = jest.fn(() => Promise.reject(error));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getIdCardTokens).toHaveBeenCalled();
      })
      .then(() => {
        jest.runOnlyPendingTimers();
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: ID_CARD_AUTHENTICATION_ERROR,
          error,
        });
      });
  });

  it('can handle errors when authenticating with a phone number', () => {
    const phoneNumber = '12345';
    const error = new Error('oh no!');
    mockApi.authenticateWithMobileId = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const authenticateWithMobileId = createBoundAction(actions.authenticateWithMobileId);
    return authenticateWithMobileId(phoneNumber).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_START_ERROR,
        error,
      });
    });
  });

  it('can cancel authentication', () => {
    const action = actions.cancelMobileAuthentication();
    expect(action).toEqual({ type: MOBILE_AUTHENTICATION_CANCEL });
  });

  it('can get a user', () => {
    const user = { iAmAUser: true };
    mockApi.getUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_USER_START });
      dispatch.mockClear();
      return Promise.resolve(user);
    });
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_USER_SUCCESS,
        user,
      });
    });
  });

  it('can handle errors when getting a user', () => {
    const error = new Error('oh no!');
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: GET_USER_ERROR, error }),
    );
  });

  it('can handle forbidden error when getting a user', () => {
    const error = new Error('oh no!');
    error.status = 403;
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('can handle bad gateway error when getting a user', () => {
    const error = new Error('oh no!');
    error.status = 502;
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('can log you out', () => {
    mockApi.logout = jest.fn(() => Promise.resolve());
    const logout = createBoundAction(actions.logOut);
    return logout().then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('logs you out locally even when the logout request fails', async () => {
    mockApi.logout = jest.fn(() => Promise.reject(new Error('network down')));
    const logout = createBoundAction(actions.logOut);

    await expect(logout()).rejects.toThrow('network down');

    expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT });
  });

  it('can get user conversion', () => {
    const userConversion = { iAmAConversion: true };
    mockApi.getUserConversionWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_USER_CONVERSION_START,
      });
      dispatch.mockClear();
      return Promise.resolve(userConversion);
    });
    const getUserConversion = createBoundAction(actions.getUserConversion);
    expect(dispatch).not.toHaveBeenCalled();
    return getUserConversion().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_USER_CONVERSION_SUCCESS,
        userConversion,
      });
    });
  });

  it('can handle errors when getting user conversion', () => {
    const error = new Error('oh no!');
    mockApi.getUserConversionWithToken = jest.fn(() => Promise.reject(error));
    const getUserConversion = createBoundAction(actions.getUserConversion);
    expect(dispatch).not.toHaveBeenCalled();
    return getUserConversion().then(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_USER_CONVERSION_ERROR,
        error,
      }),
    );
  });

  it('can handle redirect login', () => {
    expect(actions.setLoginToRedirect()).toEqual({
      type: SET_LOGIN_TO_REDIRECT,
    });
  });

  it('can handle redirect login with mobile id', () => {
    const useRedirectLoginWithPhoneNumber = createBoundAction(
      actions.useRedirectLoginWithPhoneNumber,
    );
    useRedirectLoginWithPhoneNumber(123);
    expect(dispatch).toHaveBeenCalledWith({ type: SET_LOGIN_TO_REDIRECT });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START,
    });
  });

  it('can handle redirect login with id card (mTLS)', () => {
    mockApi.authenticateWithIdCardMtls = jest.fn(() => Promise.resolve());
    const useRedirectLoginWithIdCard = createBoundAction(actions.useRedirectLoginWithIdCard);
    useRedirectLoginWithIdCard();
    expect(dispatch).toHaveBeenCalledWith({ type: SET_LOGIN_TO_REDIRECT });
    expect(dispatch).toHaveBeenCalledWith({
      type: ID_CARD_AUTHENTICATION_START,
    });
  });

  it('can handle redirect login with smart id', () => {
    const useRedirectLoginWithSmartId = createBoundAction(actions.useRedirectLoginWithSmartId);
    useRedirectLoginWithSmartId('et');
    expect(dispatch).toHaveBeenCalledWith({ type: SET_LOGIN_TO_REDIRECT });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START,
    });
  });
});
