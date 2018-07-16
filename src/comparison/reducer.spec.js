import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_BONUS_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
  SHOW_COMPARISON,
  HIDE_COMPARISON,
} from './constants';

import comparisonReducer from './reducer';

describe('Comparison reducer', () => {
  it('starts loading when starting to get comparison', () => {
    const newState = comparisonReducer(undefined, {
      type: GET_COMPARISON_START,
    });
    expect(newState.loadingComparison).toBe(true);
  });

  it('stops loading and saves comparison on getting comparison success', () => {
    const comparison = [{ amount: 2115.95, currency: 'EUR' }];
    const action = { type: GET_COMPARISON_SUCCESS, comparison };
    const newState = comparisonReducer({ loadingComparison: true }, action);
    expect(newState.loadingComparison).toBe(false);
    expect(newState.comparison).toBe(comparison);
  });

  it('stops loading and saves comparison bonus on getting comparison bonus success', () => {
    const comparison = { newFundFutureValue: 2000.12 };
    const action = { type: GET_COMPARISON_BONUS_SUCCESS, comparison };
    const newState = comparisonReducer({ loadingComparison: true }, action);
    expect(newState.loadingComparison).toBe(false);
    expect(newState.comparisonBonus).toBe(comparison);
  });

  it('stops loading and saves error on getting comparison failure', () => {
    const error = { body: { errors: [{ code: 'oh no' }] } };
    const action = { type: GET_COMPARISON_ERROR, error };

    const newState = comparisonReducer({ loadingComparison: true }, action);

    expect(newState.error).toBe(error);
    expect(newState.loadingComparison).toBe(false);
  });

  it('reacts to salary change', () => {
    const salary = 1500;
    const action = { type: COMPARISON_SALARY_CHANGE, salary };

    const newState = comparisonReducer(undefined, action);

    expect(newState.salary).toBe(salary);
  });

  it('reacts to rate change', () => {
    const rate = 8;
    const action = { type: COMPARISON_RATE_CHANGE, rate };

    const newState = comparisonReducer(undefined, action);

    expect(newState.rate).toBe(rate);
  });

  it('can show comparison', () => {
    const action = { type: SHOW_COMPARISON };
    const newState = comparisonReducer({ visible: false }, action);

    expect(newState.visible).toBe(true);
  });

  it('can show and hide comparison', () => {
    const action = { type: HIDE_COMPARISON };
    const newState = comparisonReducer({ visible: true }, action);

    expect(newState.visible).toBe(false);
  });
});
