import exchangeReducer from './reducer';
import {
  GET_EXISTING_PENSION_FUNDS_START,
  GET_EXISTING_PENSION_FUNDS_SUCCESS,
  GET_EXISTING_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
} from './constants';

describe('Exchange reducer', () => {
  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, { type: GET_EXISTING_PENSION_FUNDS_START });
    expect(newState.loadingSourceFunds).toBe(true);
  });

  it('stops loading and saves funds and default seletion when getting pension funds succeeded', () => {
    const sourceFunds = [{ name: 'name', isin: 'isin' }];
    const action = { type: GET_EXISTING_PENSION_FUNDS_SUCCESS, sourceFunds };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.sourceFunds).toBe(sourceFunds);
    expect(newState.sourceSelection).toEqual([{ name: 'name', isin: 'isin', percentage: 1 }]);
  });

  it('stops loading and saves the error when getting pension funds fails', () => {
    const error = new Error('oh no');
    const action = { type: GET_EXISTING_PENSION_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.error).toBe(error);
  });

  it('can select an exchange', () => {
    const sourceSelection = [{ iAmTheSelectedExchange: true }];
    const action = { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact: false };
    expect(exchangeReducer(undefined, action).sourceSelection).toEqual(sourceSelection);
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(false);
    action.sourceSelectionExact = true;
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(true);
  });
});
