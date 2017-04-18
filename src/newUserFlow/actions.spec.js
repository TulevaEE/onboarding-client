import { push } from 'react-router-redux';
import { SubmissionError } from 'redux-form';

import {
  CREATE_NEW_USER_START,
  CREATE_NEW_USER_SUCCESS,
  CREATE_NEW_USER_ERROR,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

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
    mockDispatch();
  });

  it('can create a new user', () => {
    const newUser = { firstName: 'Erko' };
    mockApi.createUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: CREATE_NEW_USER_START });
      dispatch.mockClear();
      return Promise.resolve(newUser);
    });
    const createNewUser = createBoundAction(actions.createNewUser);
    expect(dispatch).not.toHaveBeenCalled();
    return createNewUser()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith({ type: CREATE_NEW_USER_SUCCESS, newUser });
        expect(dispatch).toHaveBeenCalledWith(push('/payment'));
      });
  });

  it('can handle errors when creating a new user', () => {
    const error = { body: { errors: [{ path: 'personalCode', code: 'invalid' }] } };
    mockApi.createUserWithToken = jest.fn(() => Promise.reject(error));
    const createNewUser = createBoundAction(actions.createNewUser);
    expect(dispatch).not.toHaveBeenCalled();

    return createNewUser()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: CREATE_NEW_USER_ERROR, error }))
      .catch(givenError => expect(givenError).toEqual(new SubmissionError({ personalCode: 'invalid' })));
  });
});
