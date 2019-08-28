import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Account actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' }, initialCapital: {} };
    dispatch = jest.fn(action => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  it('can get initial capital', () => {
    const initialCapital = [{ initialCapital: true }];
    mockApi.getInitialCapitalWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_INITIAL_CAPITAL_START,
      });
      dispatch.mockClear();
      return Promise.resolve(initialCapital);
    });
    const getInitialCapital = createBoundAction(actions.getInitialCapital);
    expect(dispatch).not.toHaveBeenCalled();
    return getInitialCapital().then(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_INITIAL_CAPITAL_SUCCESS,
        initialCapital,
      });
    });
  });

  it('can handle errors when getting initial capital', () => {
    const error = new Error('oh no!');
    mockApi.getInitialCapitalWithToken = jest.fn(() => Promise.reject(error));
    const getInitialCapital = createBoundAction(actions.getInitialCapital);
    expect(dispatch).not.toHaveBeenCalled();
    return getInitialCapital().then(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_INITIAL_CAPITAL_ERROR,
        error,
      }),
    );
  });
});
