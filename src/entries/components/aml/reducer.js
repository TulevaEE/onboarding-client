import {
  GET_MISSING_AML_CHECKS_START,
  GET_MISSING_AML_CHECKS_SUCCESS,
  GET_MISSING_AML_CHECKS_ERROR,
} from './constants';

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
    default:
      return state;
  }
}
