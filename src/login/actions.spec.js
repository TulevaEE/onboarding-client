import {
  CHANGE_PHONE_NUMBER,

  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,

  MOBILE_AUTHENTICATION_CANCEL,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,

  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START_SUCCESS,
  ID_CARD_AUTHENTICATION_ERROR,
  ID_CARD_AUTHENTICATION_SUCCESS,

  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,

  LOG_OUT,
} from './constants';

const mockRouter = jest.genMockFromModule('../router/actions');
jest.mock('../router/actions', () => mockRouter);

jest.useFakeTimers();

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

const mockHttp = jest.genMockFromModule('../common/http');
jest.mock('../common/http', () => mockHttp);

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
    mockDispatch();
    mockApi.authenticateWithPhoneNumber = () => Promise.reject();
    mockApi.getMobileIdToken = () => Promise.reject();
    mockApi.getIdCardToken = () => Promise.reject();
    mockHttp.resetStatisticsIdentification = jest.fn();
    mockRouter.selectStateRoute = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('can change phone number', () => {
    const phoneNumber = '12312312312';
    const action = actions.changePhoneNumber(phoneNumber);
    expect(action).toEqual({
      phoneNumber,
      type: CHANGE_PHONE_NUMBER,
    });
  });

  it('can authenticate with a phone number', () => {
    const phoneNumber = '12345';
    const controlCode = '1337';
    mockApi.authenticateWithPhoneNumber = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_START });
      dispatch.mockClear();
      return Promise.resolve(controlCode);
    });
    const authenticateWithPhoneNumber = createBoundAction(actions.authenticateWithPhoneNumber);
    expect(dispatch).not.toHaveBeenCalled();
    return authenticateWithPhoneNumber(phoneNumber)
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(2); // calls next action to start polling as well.
        expect(dispatch).toHaveBeenCalledWith({
          type: MOBILE_AUTHENTICATION_START_SUCCESS,
          controlCode,
        });
      });
  });

  it('can authenticate with an id card', () => {
    const token = 'token';
    mockApi.authenticateWithIdCard = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: ID_CARD_AUTHENTICATION_START });
      dispatch.mockClear();
      return Promise.resolve();
    });
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    expect(dispatch).not.toHaveBeenCalled();
    mockApi.getIdCardToken = jest.fn(() => Promise.resolve(token));
    return authenticateWithIdCard()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith({ type: ID_CARD_AUTHENTICATION_START_SUCCESS });
      });
  });

  it('starts polling until succeeds when authenticating with a phone number and redirects', () => {
    const token = 'token';
    mockApi.authenticateWithPhoneNumber = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdToken = jest.fn(() => Promise.resolve(null));
    const authenticateWithPhoneNumber = createBoundAction(actions.authenticateWithPhoneNumber);
    return authenticateWithPhoneNumber('')
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdToken = jest.fn(() => Promise.resolve(token));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdToken).toHaveBeenCalled();
      }).then(() => {
        expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_SUCCESS, token });
        expect(mockRouter.selectStateRoute).toHaveBeenCalled();
      });
  });

  it('starts polling until fails when authenticating with a phone number', () => {
    const error = new Error('oh no!');
    mockApi.authenticateWithPhoneNumber = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdToken = jest.fn(() => Promise.resolve(null));
    const authenticateWithPhoneNumber = createBoundAction(actions.authenticateWithPhoneNumber);
    return authenticateWithPhoneNumber('123123')
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdToken = jest.fn(() => Promise.reject(error));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdToken).toHaveBeenCalled();
      }).then(() => {
        jest.runOnlyPendingTimers();
      }).then(() => {
        expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_AUTHENTICATION_ERROR, error });
      });
  });

  it('starts polling until succeeds when authenticating with a phone number and redirects', () => {
    const token = 'token';
    mockApi.authenticateWithIdCard = jest.fn(() => Promise.resolve());
    mockApi.getIdCardToken = jest.fn(() => Promise.resolve(null));
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    return authenticateWithIdCard()
      .then(() => {
        dispatch.mockClear();
        mockApi.getIdCardToken = jest.fn(() => Promise.resolve(token));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getIdCardToken).toHaveBeenCalled();
      }).then(() => {
        expect(dispatch).toHaveBeenCalledWith({ type: ID_CARD_AUTHENTICATION_SUCCESS, token });
        expect(mockRouter.selectStateRoute).toHaveBeenCalled();
      });
  });

  it('starts polling until fails when authenticating with id card', () => {
    const error = new Error('oh no!');
    mockApi.authenticateWithIdCard = jest.fn(() => Promise.resolve());
    mockApi.getIdCardToken = jest.fn(() => Promise.resolve(null));
    const authenticateWithIdCard = createBoundAction(actions.authenticateWithIdCard);
    return authenticateWithIdCard()
      .then(() => {
        dispatch.mockClear();
        mockApi.getIdCardToken = jest.fn(() => Promise.reject(error));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getIdCardToken).toHaveBeenCalled();
      }).then(() => {
        jest.runOnlyPendingTimers();
      }).then(() => {
        expect(dispatch).toHaveBeenCalledWith({ type: ID_CARD_AUTHENTICATION_ERROR, error });
      });
  });

  it('can handle errors when authenticating with a phone number', () => {
    const phoneNumber = '12345';
    const error = new Error('oh no!');
    mockApi.authenticateWithPhoneNumber = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const authenticateWithPhoneNumber = createBoundAction(actions.authenticateWithPhoneNumber);
    return authenticateWithPhoneNumber(phoneNumber)
      .then(() => {
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
    return getUser()
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_USER_SUCCESS,
          user,
        });
        expect(mockRouter.selectStateRoute).toHaveBeenCalled();
      });
  });

  it('can handle errors when getting a user', () => {
    state.login.token = 'token';
    const error = new Error('oh no!');
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_USER_ERROR, error }));
  });

  it('can handle unauthorized error when getting a user', () => {
    state.login.token = 'token';
    const error = new Error('oh no!');
    error.status = 401;
    mockApi.getUserWithToken = jest.fn(() => Promise.reject(error));
    const getUser = createBoundAction(actions.getUser);
    expect(dispatch).not.toHaveBeenCalled();
    return getUser()
        .then(() => expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT }));
  });

  it('can log you out', () => {
    expect(mockHttp.resetStatisticsIdentification).not.toHaveBeenCalled();
    expect(actions.logOut()).toEqual({ type: LOG_OUT });
    expect(mockHttp.resetStatisticsIdentification).toHaveBeenCalledTimes(1);
  });
});
