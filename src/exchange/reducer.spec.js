import exchangeReducer from './reducer';
import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
} from './constants';

describe('Exchange reducer', () => {
  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, { type: GET_PENSION_FUNDS_START });
    expect(newState.loadingPensionFunds).toBe(true);
  });

  it('stops loading and saves funds when getting pension funds succeeded', () => {
    const pensionFunds = [{ iAmAFund: true }];
    const action = { type: GET_PENSION_FUNDS_SUCCESS, pensionFunds };
    const newState = exchangeReducer({ loadingPensionFunds: true }, action);
    expect(newState.loadingPensionFunds).toBe(false);
    expect(newState.pensionFunds).toBe(pensionFunds);
  });

  it('stops loading and saves the error when getting pension funds fails', () => {
    const error = new Error('oh no');
    const action = { type: GET_PENSION_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingPensionFunds: true }, action);
    expect(newState.loadingPensionFunds).toBe(false);
    expect(newState.error).toBe(error);
  });
});
