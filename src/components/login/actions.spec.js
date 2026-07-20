import config from 'react-global-configuration';

import {
  CHANGE_PHONE_NUMBER,
  CHANGE_EMAIL,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
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

const mockHttp = jest.genMockFromModule('../common/http');
jest.mock('../common/http', () => mockHttp);

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Login actions', () => {
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
    mockApi.authenticateWithIdCode = () => Promise.reject();
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

  it('starts polling until succeeds when authenticating with smart id', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: '123456' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(null));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    return authenticateWithSmartId('50001018865')
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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    const strandedPoll = jest.fn(() => new Promise(() => {}));
    mockApi.getSmartIdTokens = strandedPoll;
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);

    await authenticateWithSmartId('50001018865');
    jest.runOnlyPendingTimers();
    expect(strandedPoll).toHaveBeenCalledTimes(1);

    actions.cancelMobileAuthentication();
    expect(strandedPoll.mock.calls[0][1].signal.aborted).toBe(true);

    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    await authenticateWithSmartId('50001018865');
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
      mockApi.authenticateWithIdCode = jest.fn(() =>
        Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
      );
      const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
      mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
      const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);

      await authenticateWithSmartId('50001018865');
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
    mockApi.authenticateWithIdCode = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFirstStart = resolve;
        }),
    );
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    const firstAttempt = authenticateWithSmartId('50001018865');

    actions.cancelMobileAuthentication();

    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '4321', authenticationHash: 'hash-b' }),
    );
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    await authenticateWithSmartId('50001018865');

    resolveFirstStart({ challengeCode: '1337', authenticationHash: 'hash-a' });
    await firstAttempt;

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.getSmartIdTokens).toHaveBeenCalledTimes(1);
    expect(mockApi.getSmartIdTokens).toHaveBeenCalledWith('hash-b', expect.anything());
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_SUCCESS,
      tokens,
      method: 'SMART_ID',
    });
  });

  it('resumes a pending smart id login after a page reload', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

    mockDispatch();
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START_SUCCESS,
      controlCode: '1337',
    });

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.getSmartIdTokens).toHaveBeenCalledWith('hash-1', expect.anything());
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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest
      .fn()
      .mockRejectedValueOnce(new TypeError(message))
      .mockResolvedValueOnce(tokens);
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');
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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
      await authenticateWithSmartId('50001018865');
      jest.runOnlyPendingTimers();

      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_START_SUCCESS,
        controlCode: '1337',
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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

    mockDispatch();
    state = { login: { loadingAuthentication: true } };
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not resume when the user is already authenticated and drops the pending login', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');
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
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    mockApi.getSmartIdTokens = jest.fn(() => new Promise(() => {}));
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);
    await authenticateWithSmartId('50001018865');

    actions.cancelMobileAuthentication();

    mockDispatch();
    const resume = createBoundAction(actions.resumePendingSmartIdAuthentication);
    resume();
    jest.runOnlyPendingTimers();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('abandons a stuck poll request and retries immediately when the tab becomes visible', async () => {
    state = { login: { loadingAuthentication: true } };
    mockApi.authenticateWithIdCode = jest.fn(() =>
      Promise.resolve({ challengeCode: '1337', authenticationHash: 'hash-1' }),
    );
    const strandedPoll = jest.fn(() => new Promise(() => {}));
    mockApi.getSmartIdTokens = strandedPoll;
    const authenticateWithSmartId = createBoundAction(actions.authenticateWithIdCode);

    await authenticateWithSmartId('50001018865');
    jest.runOnlyPendingTimers();
    expect(strandedPoll).toHaveBeenCalledTimes(1);

    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.getSmartIdTokens = jest.fn(() => Promise.resolve(tokens));
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(strandedPoll.mock.calls[0][1].signal.aborted).toBe(true);
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
    const useRedirectLoginWithIdCode = createBoundAction(actions.useRedirectLoginWithIdCode);
    useRedirectLoginWithIdCode('38501020455');
    expect(dispatch).toHaveBeenCalledWith({ type: SET_LOGIN_TO_REDIRECT });
    expect(dispatch).toHaveBeenCalledWith({
      type: MOBILE_AUTHENTICATION_START,
    });
  });
});
