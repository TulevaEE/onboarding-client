import { UPDATE_USER_START, UPDATE_USER_SUCCESS, USER_UPDATED } from '../common/user/constants';

import accountReducer from './reducer';

describe('Contact detail reducer', () => {
  it('sets submitting state when starting user update', () => {
    const action = { type: UPDATE_USER_START };
    const newState = accountReducer({ submitting: false }, action);
    expect(newState.submitting).toBe(true);
  });

  it('sets submitting state when update finished', () => {
    const action = { type: USER_UPDATED };
    const newState = accountReducer({ submitting: true }, action);
    expect(newState.submitting).toBe(false);
  });

  it('sets submitting state when update success', () => {
    const action = { type: UPDATE_USER_SUCCESS };
    const newState = accountReducer({ submitting: true }, action);
    expect(newState.submitting).toBe(false);
  });

  it('correctly sets user update success to state', () => {
    const action = { type: UPDATE_USER_SUCCESS };
    const newState = accountReducer({ updateUserSuccess: false }, action);
    expect(newState.updateUserSuccess).toBe(true);
  });

  it('removes user update success from state', () => {
    const action = { type: USER_UPDATED };
    const newState = accountReducer({ updateUserSuccess: true }, action);
    expect(newState.updateUserSuccess).toBe(false);
  });
});
