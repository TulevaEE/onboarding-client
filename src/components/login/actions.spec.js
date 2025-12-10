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

import {
  ID_CARD_LOGIN_START_FAILED_ERROR,
  WEB_EID_USER_CANCELLED,
  WEB_EID_EXTENSION_UNAVAILABLE,
} from '../common/errorAlert/ErrorAlert';

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
    mockDispatch();
    mockApi.authenticateWithMobileId = () => Promise.reject();
    mockApi.authenticateWithSmartId = () => Promise.reject();
    mockApi.authenticateWithIdCode = () => Promise.reject();
    mockApi.getMobileIdTokens = () => Promise.reject();
    mockApi.getSmartIdTokens = () => Promise.reject();
    mockApi.getIdCardTokens = () => Promise.reject();
    mockApi.authenticateWithIdCardWebEid = () => Promise.reject();
    delete window.location;
    window.location = { search: '' };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
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

  it('can authenticate with an id card (Web eID)', () => {
    delete window.location;
    window.location = { search: '?webeid=true' };

    const tokens = { accessToken: 'token', refreshToken: 'refreshToken' };
    mockApi.authenticateWithIdCardWebEid = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.resolve(tokens);
    });
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    expect(dispatch).not.toHaveBeenCalled();
    return authenticateWithIdCard().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_SUCCESS,
        tokens,
      });
    });
  });

  it('can handle Web eID user cancelled error', () => {
    delete window.location;
    window.location = { search: '?webeid=true' };

    const webEidError = { code: 'ERR_WEBEID_USER_CANCELLED' };
    const actualBroadcastedError = {
      body: { errors: [{ code: WEB_EID_USER_CANCELLED }] },
    };

    mockApi.authenticateWithIdCardWebEid = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.reject(webEidError);
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

  it('can handle Web eID extension unavailable error', () => {
    delete window.location;
    window.location = { search: '?webeid=true' };

    const webEidError = { code: 'ERR_WEBEID_EXTENSION_UNAVAILABLE' };
    const actualBroadcastedError = {
      body: { errors: [{ code: WEB_EID_EXTENSION_UNAVAILABLE }] },
    };

    mockApi.authenticateWithIdCardWebEid = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.reject(webEidError);
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

  it('can handle Web eID generic error', () => {
    delete window.location;
    window.location = { search: '?webeid=true' };

    const webEidError = new Error('Some other error');
    const actualBroadcastedError = {
      body: { errors: [{ code: ID_CARD_LOGIN_START_FAILED_ERROR }] },
    };

    mockApi.authenticateWithIdCardWebEid = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: ID_CARD_AUTHENTICATION_START,
      });
      dispatch.mockClear();
      return Promise.reject(webEidError);
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
