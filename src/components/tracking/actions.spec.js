import * as mockApi from '../common/api';

jest.mock('../common/api');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Tracking actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' } };

    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('creates tracked events', () => {

    const type = "PAGE_VIEW";
    const data = { path: '/login' }

    mockApi.createTrackedEvent = jest.fn(() => Promise.resolve());
    const trackEvent = createBoundAction(actions.trackEvent);
    return trackEvent(type, data).then(() => {
      expect(mockApi.createTrackedEvent).toHaveBeenCalledTimes(1);
    });
  });

});
