import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_ERROR,
} from './constants';

import comparisonReducer from './reducer';

describe('Comparison reducer', () => {
  it('starts loading when starting to get comparison', () => {
    const newState = comparisonReducer(undefined, { type: GET_COMPARISON_START });
    expect(newState.loadingComparison).toBe(true);
  });

  it('stops loading and saves comparison on getting comparison success', () => {
    const comparison = [{ amount: 2115.95, currency: 'EUR' }];
    const action = { type: GET_COMPARISON_SUCCESS, comparison };
    const newState = comparisonReducer({ loadingComparison: true }, action);
    expect(newState.loadingComparison).toBe(false);
    expect(newState.comparison).toBe(comparison);
  });

  it('stops loading and saves error on getting comparison failure', () => {
    const error = { body: { errors: [{ code: 'oh no' }] } };
    const action = { type: GET_COMPARISON_ERROR, error };

    const newState = comparisonReducer({ loadingComparison: true }, action);

    expect(newState.error).toBe(error);
    expect(newState.loadingComparison).toBe(false);
  });
});
