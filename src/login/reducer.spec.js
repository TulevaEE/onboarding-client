import loginReducer from './reducer';
import {
  CHANGE_PHONE_NUMBER,

  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,

  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,

  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_ERROR,
  ID_CARD_AUTHENTICATION_START_ERROR,

  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,

  LOG_OUT,
} from './constants';

describe('Login reducer', () => {
  it('changes phone number', () => {
    const phoneNumber = 'a phone number';
    const action = { type: CHANGE_PHONE_NUMBER, phoneNumber };
    expect(loginReducer(undefined, action).phoneNumber).toBe(phoneNumber);
  });

  it('starts loading control code and resets error when starting mobile authentication', () => {
    const action = { type: MOBILE_AUTHENTICATION_START };
    const newState = loginReducer({ error: { anError: true } }, action);
    expect(newState.loadingAuthentication).toBe(true);
    expect(newState.error).toBe(null);
  });

  it('stops loading and saves the control code when starting mobile authentication succeeds', () => {
    const controlCode = '1234';
    const action = { type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode };
    const newState = loginReducer(undefined, action);
    expect(newState.loadingAuthentication).toBe(false);
    expect(newState.controlCode).toBe(controlCode);
  });

  it('stops loading and saves the error when starting mobile authentication fails', () => {
    const error = new Error('oh no');
    const action = { type: MOBILE_AUTHENTICATION_START_ERROR, error };
    const newState = loginReducer(undefined, action);
    expect(newState.loadingAuthentication).toBe(false);
    expect(newState.error).toBe(error);
  });

  it('sets the token when mobile authentication succeeds', () => {
    const token = 'token';
    const action = { type: MOBILE_AUTHENTICATION_SUCCESS, token };
    const newState = loginReducer(undefined, action);
    expect(newState.token).toBe(token);
    expect(newState.loginMethod).toBe('mobileId');
  });

  it('sets the error when mobile authentication fails', () => {
    const error = new Error('oh no');
    const action = { type: MOBILE_AUTHENTICATION_ERROR, error };
    const newState = loginReducer(undefined, action);
    expect(newState.token).toBe(null);
    expect(newState.controlCode).toBe(null);
    expect(newState.loadingAuthentication).toBe(false);
    expect(newState.loadingUser).toBe(false);
  });

  it('removes control code and loading when cancelling mobile authentication', () => {
    const action = { type: MOBILE_AUTHENTICATION_CANCEL };
    const newState = loginReducer({ loadingAuthentication: true, controlCode: '1337' }, action);
    expect(newState.loadingAuthentication).toBe(false);
    expect(newState.controlCode).toBe(null);
  });

  it('resets error when starting id card authentication', () => {
    const action = { type: ID_CARD_AUTHENTICATION_START };
    const newState = loginReducer({ error: { anError: true } }, action);
    expect(newState.error).toBe(null);
  });

  it('sets the token when id card authentication succeeds', () => {
    const token = 'token';
    const action = { type: ID_CARD_AUTHENTICATION_SUCCESS, token };
    expect(loginReducer(undefined, action).token).toBe(token);
  });

  it('sets the error when mobile authentication fails', () => {
    const error = new Error('oh noes!!1');
    const action = { type: ID_CARD_AUTHENTICATION_START_ERROR, error };
    const newState = loginReducer(undefined, action);
    expect(newState.token).toBe(null);
    expect(newState.error).toBe(error);
  });


  it('sets the error when mobile authentication fails', () => {
    const error = new Error('oh noes!!1');
    const action = { type: ID_CARD_AUTHENTICATION_ERROR, error };
    const newState = loginReducer(undefined, action);
    expect(newState.token).toBe(null);
    expect(newState.error).toBe(error);
  });

  it('starts loading when user when starting to get the user', () => {
    const newState = loginReducer(undefined, { type: GET_USER_START });
    expect(newState.user).toBe(null);
    expect(newState.loadingUser).toBe(true);
    expect(newState.userError).toBe(null);
  });

  it('stops loading and saves the user once user is received', () => {
    const user = { hello: 'world' };
    const newState = loginReducer({ loadingUser: true }, { type: GET_USER_SUCCESS, user });
    expect(newState.user).toBe(user);
    expect(newState.loadingUser).toBe(false);
    expect(newState.userError).toBe(null);
  });

  it('stops loading and saves the error if getting hte user fails', () => {
    const error = new Error('oh no!');
    const newState = loginReducer({ loadingUser: true }, { type: GET_USER_ERROR, error });
    expect(newState.loadingUser).toBe(false);
    expect(newState.userError).toBe(error);
  });

  it('removes token and login method flag when you log out', () => {
    const newState = loginReducer({ token: 'token', loginMethod: 'mobileId' }, { type: LOG_OUT });
    expect(newState.token).toBe(null);
    expect(newState.loginMethod).toBe(null);
    expect(newState.loadingUser).toBe(false);
  });
});
