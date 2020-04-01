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
  TOKEN_REFRESH_START,
  TOKEN_REFRESH_SUCCESS,
  TOKEN_REFRESH_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
  CHANGE_PERSONAL_CODE,
} from './constants';

import { ID_CARD_LOGIN_START_FAILED_ERROR } from '../common/errorAlert/ErrorAlert';

jest.useFakeTimers();

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
    dispatch = jest.fn(action => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    mockDispatch();
    mockApi.authenticateWithMobileId = () => Promise.reject();
    mockApi.authenticateWithIdCode = () => Promise.reject();
    mockApi.getMobileIdTokens = () => Promise.reject();
    mockApi.getIdCardTokens = () => Promise.reject();
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

  it('can authenticate with an id card', () => {
    const tokens = { accessToken: 'token' };
    mockApi.authenticateWithIdCard = jest.fn(() => {
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
    const tokens = { accessToken: 'token' };
    const handleIdCardLogin = createBoundAction(actions.handleIdCardLogin);
    expect(dispatch).not.toHaveBeenCalled();
    mockApi.getIdCardTokens = jest.fn(() => Promise.resolve(tokens));

    handleIdCardLogin({ login: 'idCard' });

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith({
      type: ID_CARD_AUTHENTICATION_START,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ID_CARD_AUTHENTICATION_START_SUCCESS,
    });
  });

  it('can handle authenticate with an id card start error', () => {
    const initialError = new Error('oh no!');
    const actualBroadcastedError = {
      body: { errors: [{ code: ID_CARD_LOGIN_START_FAILED_ERROR }] },
    };

    mockApi.authenticateWithIdCard = jest.fn(() => {
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
    const tokens = { accessToken: 'token' };
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
          method: 'mobileId',
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

  it('starts polling until succeeds when authenticating with id card', () => {
    const tokens = { accessToken: 'token' };
    mockApi.authenticateWithIdCard = jest.fn(() => Promise.resolve());
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

  it('starts polling until fails when authenticating with id card', () => {
    const error = new Error('oh no!');
    mockApi.authenticateWithIdCard = jest.fn(() => Promise.resolve());
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
    state.login.token = 'token';
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
    state.login.token = 'token';
    const error = new Error('oh no!');
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: GET_USER_ERROR, error }),
    );
  });

  it('can handle unauthorized error when getting a user', () => {
    state.login.token = 'token';
    const error = new Error('oh no!');
    error.status = 401;
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('can handle bad gateway error when getting a user', () => {
    state.login.token = 'token';
    const error = new Error('oh no!');
    error.status = 502;
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser().then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('can log you out', () => {
    expect(actions.logOut()).toEqual({ type: LOG_OUT });
  });

  it('can get user conversion', () => {
    state.login.token = 'token';
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
    state.login.token = 'token';
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

  it('can refresh a token', () => {
    state.login.refreshToken = 'old_refresh_token';
    const tokens = { accessToken: 'access', refreshToken: 'refresh' };
    mockApi.refreshTokenWith = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: TOKEN_REFRESH_START });
      dispatch.mockClear();
      return Promise.resolve(tokens);
    });

    const refreshToken = createBoundAction(actions.refreshToken);
    expect(dispatch).not.toHaveBeenCalled();

    return refreshToken().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: TOKEN_REFRESH_SUCCESS,
        tokens,
      });
    });
  });

  it('can handle refresh token errors', () => {
    const error = new Error('awww noes');
    mockApi.refreshTokenWith = jest.fn(() => Promise.reject(error));

    const refreshToken = createBoundAction(actions.refreshToken);
    expect(dispatch).not.toHaveBeenCalled();

    return refreshToken().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: TOKEN_REFRESH_ERROR,
        error,
      });
    });
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

  it('can handle redirect login with id card', () => {
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
