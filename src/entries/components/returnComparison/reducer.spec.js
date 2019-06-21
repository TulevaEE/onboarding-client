import {
  GET_RETURN_COMPARISON_START,
  GET_RETURN_COMPARISON_SUCCESS,
  GET_RETURN_COMPARISON_ERROR,
} from './constants';
import reducer, { initialState } from './reducer';
import { LOG_OUT } from '../login/constants';

describe('Return comparison reducer', () => {
  it('starts loading when starting to get return comparison', () => {
    const state = reducer(undefined, { type: GET_RETURN_COMPARISON_START });

    expect(state).toEqual({ ...initialState, loading: true });
  });

  it('stops loading and saves percentages when getting return comparison succeeds', () => {
    const state = reducer(undefined, {
      type: GET_RETURN_COMPARISON_SUCCESS,
      actualPercentage: 0.0123,
      estonianPercentage: 0.0456,
      marketPercentage: 0.0789,
    });

    expect(state).toEqual({
      loading: false,
      actualPercentage: 0.0123,
      estonianPercentage: 0.0456,
      marketPercentage: 0.0789,
    });
  });

  it('stops loading and saves error when getting return comparison fails', () => {
    const state = reducer(undefined, {
      type: GET_RETURN_COMPARISON_ERROR,
      error: { message: 'An error' },
    });

    expect(state).toEqual({ ...initialState, error: { message: 'An error' } });
  });

  it('clears state on logout', () => {
    const state = reducer(undefined, { type: LOG_OUT });

    expect(state).toEqual(initialState);
  });
});
