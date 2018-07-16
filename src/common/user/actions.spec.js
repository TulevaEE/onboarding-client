import { push } from 'react-router-redux';
import { SubmissionError } from 'redux-form';
import config from 'react-global-configuration';

import { UPDATE_USER_START, UPDATE_USER_SUCCESS, UPDATE_USER_ERROR } from './constants';

const mockApi = jest.genMockFromModule('../api');
jest.mock('../api', () => mockApi);

const actions = require('./actions');

describe('newUserFlow actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' }, exchange: {} };
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    config.set({ clientCredentialsAccessToken: '123' }, { freeze: false });
    mockDispatch();
  });

  it('can register a new user', () => {
    const newUser = { firstName: 'Erko' };
    mockApi.updateUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_START });
      dispatch.mockClear();
      return Promise.resolve(newUser);
    });
    const registerUser = createBoundAction(actions.registerUser);
    expect(dispatch).not.toHaveBeenCalled();
    return registerUser(newUser).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_SUCCESS, newUser });
      expect(dispatch).toHaveBeenCalledWith(push('/steps/payment'));
    });
  });

  it('can handle errors when registering a new user', () => {
    const error = { body: { errors: [{ path: 'personalCode', code: 'invalid' }] } };
    mockApi.updateUserWithToken = jest.fn(() => Promise.reject(error));
    const registerUser = createBoundAction(actions.registerUser);
    expect(dispatch).not.toHaveBeenCalled();

    return registerUser()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_ERROR, error }))
      .catch(givenError =>
        expect(givenError).toEqual(new SubmissionError({ personalCode: 'invalid' })),
      );
  });

  it('can create a new user', () => {
    const newUser = { firstName: 'Jordan' };
    mockApi.createUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_START });
      dispatch.mockClear();
      return Promise.resolve(newUser);
    });
    const registerUser = createBoundAction(actions.createUser);
    expect(dispatch).not.toHaveBeenCalled();
    return registerUser(newUser).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_SUCCESS, newUser });
    });
  });

  it('can handle errors when creating a new user', () => {
    const error = { body: { errors: [{ path: 'personalCode', code: 'invalid' }] } };
    mockApi.createUserWithToken = jest.fn(() => Promise.reject(error));
    const registerUser = createBoundAction(actions.createUser);
    expect(dispatch).not.toHaveBeenCalled();

    return registerUser()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_ERROR, error }))
      .catch(givenError =>
        expect(givenError).toEqual(new SubmissionError({ personalCode: 'invalid' })),
      );
  });
});
