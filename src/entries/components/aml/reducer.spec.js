import amlReducer, { initialState } from './reducer';
import {
  GET_MISSING_AML_CHECKS_ERROR,
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
} from './constants';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';

describe('AML reducer', () => {
  it('starts loading when getting aml checks', () => {
    const newState = amlReducer(initialState, {
      type: GET_MISSING_AML_CHECKS_START,
    });
    expect(newState.loading).toBe(true);
    expect(newState.error).toBe(null);
    expect(newState.missingAmlChecks).toBe(null);
  });

  it('stops loading and saves missing aml checks when api call succeeded', () => {
    const missingAmlChecks = [{ type: 'CONTACT_DETAILS', success: false }];
    const action = { type: GET_MISSING_AML_CHECKS_SUCCESS, missingAmlChecks };
    const newState = amlReducer({ ...initialState, loading: true }, action);
    expect(newState.loading).toBe(false);
    expect(newState.error).toBe(null);
    expect(newState.missingAmlChecks).toEqual(missingAmlChecks);
  });

  it('stops loading and saves the error when getting missing aml checks fails', () => {
    const error = { body: { errors: [{ code: 'oh no' }] } };
    const action = { type: GET_MISSING_AML_CHECKS_ERROR, error };

    const newState = amlReducer({ ...initialState, loading: true }, action);

    expect(newState.error).toBe(error);
    expect(newState.loading).toBe(false);
    expect(newState.missingAmlChecks).toBe(null);
  });

  it('removes missing contact details check after updating user', () => {
    const user = {};
    const missingAmlChecks = [{ type: 'CONTACT_DETAILS', success: false }];
    const action = { type: UPDATE_USER_SUCCESS, user };

    const newState = amlReducer({ ...initialState, missingAmlChecks }, action);

    expect(newState.missingAmlChecks).toEqual([]);
  });
});
