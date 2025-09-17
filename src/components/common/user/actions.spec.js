import { SubmissionError } from 'redux-form';
import config from 'react-global-configuration';

import { UPDATE_USER_START, UPDATE_USER_SUCCESS, UPDATE_USER_ERROR } from './constants';

const mockApi = jest.genMockFromModule('../api');
jest.mock('../api', () => mockApi);

// eslint-disable-next-line @typescript-eslint/no-var-requires
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

  it('can update a new user', () => {
    const newUser = { firstName: 'Erko' };
    mockApi.updateUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_START });
      dispatch.mockClear();
      return Promise.resolve(newUser);
    });
    const updateUser = createBoundAction(actions.updateUser);
    expect(dispatch).not.toHaveBeenCalled();
    return updateUser(newUser).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: UPDATE_USER_SUCCESS,
        newUser,
      });
    });
  });

  it('can handle errors when updating a user', () => {
    const error = {
      body: { errors: [{ path: 'personalCode', code: 'invalid' }] },
    };
    mockApi.updateUserWithToken = jest.fn(() => Promise.reject(error));
    const updateUser = createBoundAction(actions.updateUser);
    expect(dispatch).not.toHaveBeenCalled();

    return updateUser()
      .then(() =>
        expect(dispatch).toHaveBeenCalledWith({
          type: UPDATE_USER_ERROR,
          error,
        }),
      )
      .catch((givenError) =>
        expect(givenError).toEqual(new SubmissionError({ personalCode: 'invalid' })),
      );
  });

  it('can create a new user', () => {
    const newUser = { firstName: 'Jordan' };
    mockApi.updateUserWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: UPDATE_USER_START });
      dispatch.mockClear();
      return Promise.resolve(newUser);
    });
    mockApi.redirectToPayment = jest.fn();
    const createUser = createBoundAction(actions.createNewMember);
    expect(dispatch).not.toHaveBeenCalled();
    return createUser(newUser).then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: UPDATE_USER_SUCCESS,
        newUser,
      });
      expect(mockApi.redirectToPayment).toHaveBeenCalledWith({
        recipientPersonalCode: newUser.personalCode,
        amount: null,
        currency: 'EUR',
        type: 'MEMBER_FEE',
        paymentChannel: 'TULUNDUSUHISTU',
      });
    });
  });

  it('can handle errors when creating a new user', () => {
    const error = {
      body: { errors: [{ path: 'personalCode', code: 'invalid' }] },
    };
    mockApi.updateUserWithToken = jest.fn(() => Promise.reject(error));
    const registerUser = createBoundAction(actions.createNewMember);
    expect(dispatch).not.toHaveBeenCalled();

    return registerUser()
      .then(() =>
        expect(dispatch).toHaveBeenCalledWith({
          type: UPDATE_USER_ERROR,
          error,
        }),
      )
      .catch((givenError) => expect(givenError).toEqual(new SubmissionError({ email: 'invalid' })));
  });
});
