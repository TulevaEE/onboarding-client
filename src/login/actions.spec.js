import {
  CHANGE_PHONE_NUMBER,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Login actions', () => {
  let dispatch;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch);
  }

  beforeEach(() => {
    dispatch = jest.fn();
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
      expect(dispatch).toHaveBeenCalledWith({
        type: MOBILE_AUTHENTICATION_START,
        phoneNumber,
      });
      dispatch.mockClear();
      return Promise.resolve(controlCode);
    });
    const authenticateWithPhoneNumber = createBoundAction(actions.authenticateWithPhoneNumber);
    expect(dispatch).not.toHaveBeenCalled();
    return authenticateWithPhoneNumber(phoneNumber)
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: MOBILE_AUTHENTICATION_START_SUCCESS,
          controlCode,
        });
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
});
