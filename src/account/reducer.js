import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

import {
  UPDATE_USER_SUCCESS,
} from '../common/user/constants';

const initialState = {
  initialCapital: null,
  loadingInitialCapital: false,
  error: null,
  updateUserSuccess: false,
};

export default function comparisonReducer(state = initialState, action) {
  switch (action.type) {
    case GET_INITIAL_CAPITAL_START:
      return { ...state,
        loadingInitialCapital: true,
        error: null,
      };
    case GET_INITIAL_CAPITAL_SUCCESS:
      return {
        ...state,
        loadingInitialCapital: false,
        initialCapital: action.initialCapital,
      };
    case GET_INITIAL_CAPITAL_ERROR:
      return { ...state,
        loadingInitialCapital: false,
        error: action.error,
      };
    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        updateUserSuccess: true,
      };
    default:
      return state;
  }
}

