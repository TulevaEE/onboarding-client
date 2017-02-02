import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
jest.mock('../common/api', () => mockApi);

const actions = require('./actions'); // need to use require because of jest mocks being weird

describe('Exchange actions', () => {
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
    });
  }

  beforeEach(mockDispatch);

  it('can get pension funds', () => {
    const sourceFunds = [{ iAmPensionFunds: true }];
    mockApi.getSourceFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(sourceFunds);
    });
    const getSourceFunds = createBoundAction(actions.getSourceFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getSourceFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_SOURCE_FUNDS_SUCCESS,
          sourceFunds,
        });
      });
  });

  it('can handle errors when getting pension funds', () => {
    const error = new Error('oh no!');
    mockApi.getSourceFundsWithToken = jest.fn(() => Promise.reject(error));
    const getSourceFunds = createBoundAction(actions.getSourceFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getSourceFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_ERROR, error }));
  });

  it('can select an exchange', () => {
    const sourceSelection = [{ exchangeMe: true }];
    expect(actions.selectExchangeSources(sourceSelection)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    });
    expect(actions.selectExchangeSources(sourceSelection, true)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: true,
    });
  });
});
