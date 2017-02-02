import {
  GET_EXISTING_PENSION_FUNDS_START,
  GET_EXISTING_PENSION_FUNDS_SUCCESS,
  GET_EXISTING_PENSION_FUNDS_ERROR,
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
    const pensionFunds = [{ iAmPensionFunds: true }];
    mockApi.getExistingPensionFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_EXISTING_PENSION_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(pensionFunds);
    });
    const getExistingPensionFunds = createBoundAction(actions.getExistingPensionFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getExistingPensionFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_EXISTING_PENSION_FUNDS_SUCCESS,
          pensionFunds,
        });
      });
  });

  it('can handle errors when getting pension funds', () => {
    const error = new Error('oh no!');
    mockApi.getExistingPensionFundsWithToken = jest.fn(() => Promise.reject(error));
    const getExistingPensionFunds = createBoundAction(actions.getExistingPensionFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getExistingPensionFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_EXISTING_PENSION_FUNDS_ERROR, error }));
  });

  it('can select an exchange', () => {
    const exchange = [{ exchangeMe: true }];
    expect(actions.selectExchangeSources(exchange)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      exchange,
      selectedSome: false,
    });
    expect(actions.selectExchangeSources(exchange, true)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      exchange,
      selectedSome: true,
    });
  });
});
