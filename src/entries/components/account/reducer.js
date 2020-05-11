import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

import { LOG_OUT } from '../login/constants';

export const initialState = {
  initialCapital: null,
  loadingInitialCapital: false,
  error: null,
};

export default function accountReducer(state = initialState, action) {
  switch (action.type) {
    case GET_INITIAL_CAPITAL_START:
      return {
        ...state,
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
      return {
        ...state,
        loadingInitialCapital: false,
        error: action.error,
      };
    case LOG_OUT:
      return initialState;
    default:
      return state;
  }
}
