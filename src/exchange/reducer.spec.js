import exchangeReducer from './reducer';
import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE,
} from './constants';

describe('Exchange reducer', () => {
  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, { type: GET_PENSION_FUNDS_START });
    expect(newState.loadingPensionFunds).toBe(true);
  });

  it('stops loading and saves funds and default seletion when getting pension funds succeeded', () => {
    const pensionFunds = [{ name: 'name', isin: 'isin' }];
    const action = { type: GET_PENSION_FUNDS_SUCCESS, pensionFunds };
    const newState = exchangeReducer({ loadingPensionFunds: true }, action);
    expect(newState.loadingPensionFunds).toBe(false);
    expect(newState.pensionFunds).toBe(pensionFunds);
    expect(newState.selection).toEqual([{ name: 'name', isin: 'isin', percentage: 1 }]);
  });

  it('stops loading and saves the error when getting pension funds fails', () => {
    const error = new Error('oh no');
    const action = { type: GET_PENSION_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingPensionFunds: true }, action);
    expect(newState.loadingPensionFunds).toBe(false);
    expect(newState.error).toBe(error);
  });

  it('can select an exchange', () => {
    const exchange = [{ iAmTheSelectedExchange: true }];
    const action = { type: SELECT_EXCHANGE, exchange, selectedSome: false };
    expect(exchangeReducer(undefined, action).selection).toEqual(exchange);
    expect(exchangeReducer(undefined, action).selectedSome).toBe(false);
    action.selectedSome = true;
    expect(exchangeReducer(undefined, action).selectedSome).toBe(true);
  });
});
