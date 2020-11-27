import {
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
  GET_MISSING_AML_CHECKS_ERROR,
} from './constants';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';

export const initialState = {
  loading: false,
  error: null,
  missingAmlChecks: null,
};

export default function amlReducer(state = initialState, action) {
  switch (action.type) {
    case GET_MISSING_AML_CHECKS_START:
      return { ...state, loading: true, error: null };
    case GET_MISSING_AML_CHECKS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        missingAmlChecks: action.missingAmlChecks,
      };
    case GET_MISSING_AML_CHECKS_ERROR:
      return { ...state, loading: false, error: action.error };
    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        missingAmlChecks: state.missingAmlChecks
          ? state.missingAmlChecks.filter(check => check.type !== 'CONTACT_DETAILS')
          : null,
      };
    default:
      return state;
  }
}
