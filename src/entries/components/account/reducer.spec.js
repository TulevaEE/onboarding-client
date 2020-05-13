import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

import { LOG_OUT } from '../login/constants';

import accountReducer, { initialState } from './reducer';

describe('Account reducer', () => {
  it('starts loading when starting to get initial capital', () => {
    const newState = accountReducer(undefined, {
      type: GET_INITIAL_CAPITAL_START,
    });
    expect(newState.loadingInitialCapital).toBe(true);
  });

  it('stops loading and saves initial capital on getting initial capital success', () => {
    const initialCapital = [{ amount: 2115.95, currency: 'EUR' }];
    const action = { type: GET_INITIAL_CAPITAL_SUCCESS, initialCapital };
    const newState = accountReducer({ loadingInitialCapital: true }, action);
    expect(newState.loadingInitialCapital).toBe(false);
    expect(newState.initialCapital).toBe(initialCapital);
  });

  it('stops loading and saves error on getting initial capital failure', () => {
    const error = { body: { errors: [{ code: 'oh no' }] } };
    const action = { type: GET_INITIAL_CAPITAL_ERROR, error };

    const newState = accountReducer({ loadingInitialCapital: true }, action);

    expect(newState.error).toBe(error);
    expect(newState.loadingInitialCapital).toBe(false);
  });

  it('correctly removes the state on logout', () => {
    const action = { type: LOG_OUT };

    const newState = accountReducer({}, action);

    expect(newState).toEqual(initialState);
  });
});
