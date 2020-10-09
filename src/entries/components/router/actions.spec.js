import { push } from 'connected-react-router';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Routing actions', () => {
  let dispatch;
  let state;

  function mockDispatch() {
    state = {};
    state.login = {};
    state.login.user = {};
    state.exchange = {};
    state.router = {};
    dispatch = jest.fn(action => {
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

  it('can perform routing when user is not loaded', () => {
    state.login = {};

    const action = createBoundAction(actions.selectRouteForState);
    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(push('/'));
  });
});
