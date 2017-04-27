import { push } from 'react-router-redux';

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Routing actions', () => {
  let dispatch;
  let state;

  function mockDispatch() {
    // state = { login: { user: {} } };
    state = {};
    state.login = { };
    state.login.user = {};
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('can perform a member routing', () => {
    state.login.user.memberNumber = 123;

    const action = createBoundAction(actions.route);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/steps/select-sources'));
  });

  it('can perform non member routing', () => {
    state.login.user.memberNumber = null;

    const action = createBoundAction(actions.route);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/newUser'));
  });
});
