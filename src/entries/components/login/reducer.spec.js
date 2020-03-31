import loginReducer, { initialState } from './reducer';
import {
  CHANGE_PHONE_NUMBER,
  CHANGE_EMAIL,
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
  GET_USER_CONVERSION_START,
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_CONVERSION_ERROR,
  TOKEN_REFRESH_SUCCESS,
  TOKEN_REFRESH_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
  CHANGE_PERSONAL_CODE,
} from './constants';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';

describe('Login reducer', () => {
  it('changes phone number', () => {
    const phoneNumber = 'a phone number';
    const action = { type: CHANGE_PHONE_NUMBER, phoneNumber };
    expect(loginReducer(undefined, action).phoneNumber).toBe(phoneNumber);
  });

  it('changes identity code', () => {
    const personalCode = 'personalCode';
    const action = { type: CHANGE_PERSONAL_CODE, personalCode };
    expect(loginReducer(undefined, action).personalCode).toBe(personalCode);
  });

  it('changes email', () => {
    const email = 'an email';
    const action = { type: CHANGE_EMAIL, email };
    expect(loginReducer(undefined, action).email).toBe(email);
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
    const error = { body: { errors: [{ code: 'oh no!' }] } };
    const action = { type: MOBILE_AUTHENTICATION_START_ERROR, error };

    const newState = loginReducer(undefined, action);

    expect(newState.loadingAuthentication).toBe(false);
    expect(newState.error).toBe('oh no!');
  });

  it('sets the tokens when mobile authentication succeeds', () => {
    const tokens = { accessToken: 'token', refreshToken: 'refresh' };
    const action = { type: MOBILE_AUTHENTICATION_SUCCESS, tokens, method: 'mobileId' };
    const newState = loginReducer(undefined, action);
    expect(newState.token).toBe('token');
    expect(newState.refreshToken).toBe('refresh');
    expect(newState.loginMethod).toBe('mobileId');
  });

  it('sets the error when mobile authentication fails', () => {
    // eslint-disable-next-line @typescript-eslint/camelcase
    const error = { body: { error_description: 'oh no' } };
    const action = { type: MOBILE_AUTHENTICATION_ERROR, error };

    const newState = loginReducer(undefined, action);

    expect(newState.error).toBe('oh no');
    expect(newState.token).toBe(null);
    expect(newState.refreshToken).toBe(null);
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
    const tokens = { accessToken: 'token', refreshToken: 'refresh' };
    const action = { type: ID_CARD_AUTHENTICATION_SUCCESS, tokens };
    expect(loginReducer(undefined, action).token).toBe('token');
    expect(loginReducer(undefined, action).refreshToken).toBe('refresh');
  });

  it('sets the error when mobile authentication fails', () => {
    const error = { body: { errors: [{ code: 'oh noes!!1' }] } };
    const action = { type: ID_CARD_AUTHENTICATION_START_ERROR, error };

    const newState = loginReducer(undefined, action);

    expect(newState.error).toBe('oh noes!!1');
    expect(newState.token).toBe(null);
    expect(newState.refreshToken).toBe(null);
  });

  it('sets the error when mobile authentication fails', () => {
    // eslint-disable-next-line @typescript-eslint/camelcase
    const error = { body: { error_description: 'oh noes!!1' } };
    const action = { type: ID_CARD_AUTHENTICATION_ERROR, error };

    const newState = loginReducer(undefined, action);

    expect(newState.error).toBe('oh noes!!1');
    expect(newState.token).toBe(null);
    expect(newState.refreshToken).toBe(null);
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

  it('stops loading and saves the error if getting the user fails', () => {
    const errorMessage = 'oh no!';
    const error = { body: { errors: [{ code: errorMessage }] } };

    const newState = loginReducer({ loadingUser: true }, { type: GET_USER_ERROR, error });

    expect(newState.userError).toBe(errorMessage);
    expect(newState.loadingUser).toBe(false);
    expect(newState.error).toBe(errorMessage);
  });

  it('saves updated user to state', () => {
    const newUser = { hello: 'world' };
    const newState = loginReducer({}, { type: UPDATE_USER_SUCCESS, newUser });
    expect(newState.user).toBe(newUser);
  });

  it('removes token and login method flag when you log out', () => {
    const newState = loginReducer(undefined, { type: LOG_OUT });

    expect(newState).toEqual(initialState);
  });

  it('starts loading when starting to get the user conversion', () => {
    const newState = loginReducer(undefined, {
      type: GET_USER_CONVERSION_START,
    });
    expect(newState.userConversion).toBe(null);
    expect(newState.loadingUserConversion).toBe(true);
    expect(newState.userConversionError).toBe(null);
  });

  it('stops loading and saves the user once user conversion is received', () => {
    const userConversion = { hello: 'world' };
    const newState = loginReducer(
      { loadingUser: true },
      { type: GET_USER_CONVERSION_SUCCESS, userConversion },
    );
    expect(newState.userConversion).toBe(userConversion);
    expect(newState.loadingUserConversion).toBe(false);
    expect(newState.userConversionError).toBe(null);
  });

  it('stops loading and saves the error if getting the user conversion fails', () => {
    const errorMessage = 'error!';
    const error = { body: { errors: [{ code: errorMessage }] } };

    const newState = loginReducer(
      { loadingUserConversion: true },
      { type: GET_USER_CONVERSION_ERROR, error },
    );

    expect(newState.userConversionError).toBe(errorMessage);
    expect(newState.loadingUserConversion).toBe(false);
    expect(newState.error).toBe(errorMessage);
  });

  it('can refresh token', () => {
    const oldState = { token: 'old_token', refreshToken: 'old_refresh_token' };
    const tokens = {
      accessToken: 'new_token',
      refreshToken: 'new_refresh_token',
    };

    const newState = loginReducer(oldState, {
      type: TOKEN_REFRESH_SUCCESS,
      tokens,
    });

    expect(newState.token).toBe('new_token');
    expect(newState.refreshToken).toBe('new_refresh_token');
    expect(newState.error).toBe(null);
  });

  it('handles errors on token refresh', () => {
    const oldState = { token: 'old_token', refreshToken: 'old_refresh_token' };
    // eslint-disable-next-line @typescript-eslint/camelcase
    const error = { body: { error_description: 'oh noes' } };

    const newState = loginReducer(oldState, {
      type: TOKEN_REFRESH_ERROR,
      error,
    });

    expect(newState.token).toBe(null);
    expect(newState.refreshToken).toBe(null);
    expect(newState.error).toBe('oh noes');
  });

  it('can switch to redirect login ', () => {
    const newState = loginReducer(undefined, { type: SET_LOGIN_TO_REDIRECT });
    expect(newState.redirectLogin).toBe(true);
  });
});
