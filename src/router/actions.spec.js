const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Routing actions', () => {
  let dispatch;
  let state;

  function mockDispatch() {
    state = { login: {} };
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


  it('can perform routing', () => {
    const action = createBoundAction(actions.getRoute());

    action();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: '@router/blah' });
  });
});
