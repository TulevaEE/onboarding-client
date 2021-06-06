import { UPDATE_USER_SUCCESS, USER_UPDATED } from '../common/user/constants';

import accountReducer from './reducer';

describe('Contact detail reducer', () => {
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
