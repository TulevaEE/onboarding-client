import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE,
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
    mockApi.getPensionFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_PENSION_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(pensionFunds);
    });
    const getPensionFunds = createBoundAction(actions.getPensionFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getPensionFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_PENSION_FUNDS_SUCCESS,
          pensionFunds,
        });
      });
  });

  it('can handle errors when getting pension funds', () => {
    const error = new Error('oh no!');
    mockApi.getPensionFundsWithToken = jest.fn(() => Promise.reject(error));
    const getPensionFunds = createBoundAction(actions.getPensionFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getPensionFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_PENSION_FUNDS_ERROR, error }));
  });

  it('can select an exchange', () => {
    const exchange = [{ exchangeMe: true }];
    expect(actions.selectExchange(exchange)).toEqual({
      type: SELECT_EXCHANGE,
      exchange,
      selectedSome: false,
    });
    expect(actions.selectExchange(exchange, true)).toEqual({
      type: SELECT_EXCHANGE,
      exchange,
      selectedSome: true,
    });
  });
});
