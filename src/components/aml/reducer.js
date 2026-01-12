import {
  CHANGE_OCCUPATION,
  CHANGE_POLITICALLY_EXPOSED,
  CHANGE_RESIDENCY,
  CREATE_AML_CHECKS_START,
  CREATE_AML_CHECKS_SUCCESS,
  CREATE_AML_CHECKS_ERROR,
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
  GET_MISSING_AML_CHECKS_ERROR,
} from './constants';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';

export const initialState = {
  isPoliticallyExposed: true,
  isResident: null,
  occupation: null,
  loading: false,
  error: null,
  missingAmlChecks: null,
  createAmlChecksSuccess: null,
};

export default function amlReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_POLITICALLY_EXPOSED:
      return {
        ...state,
        isPoliticallyExposed: action.isPoliticallyExposed,
      };
    case CHANGE_RESIDENCY:
      return {
        ...state,
        isResident: action.isResident,
      };
    case CHANGE_OCCUPATION:
      return {
        ...state,
        occupation: action.occupation,
      };

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

    case CREATE_AML_CHECKS_START:
      return {
        ...state,
        loading: true,
        error: null,
        createAmlChecksSuccess: null,
      };
    case CREATE_AML_CHECKS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        createAmlChecksSuccess: true,
      };
    case CREATE_AML_CHECKS_ERROR:
      return {
        ...state,
        loading: false,
        createAmlChecksSuccess: false,
        error: action.error,
      };

    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        missingAmlChecks: state.missingAmlChecks
          ? state.missingAmlChecks.filter((check) => check.type !== 'CONTACT_DETAILS')
          : null,
      };
    default:
      return state;
  }
}
