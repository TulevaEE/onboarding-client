import {
  GET_RETURN_COMPARISON_START,
  GET_RETURN_COMPARISON_SUCCESS,
  GET_RETURN_COMPARISON_ERROR,
} from './constants';
import { LOG_OUT } from '../login/constants';

export const initialState = {
  loading: false,
  actualPercentage: null,
  estonianPercentage: null,
  marketPercentage: null,
};

export default function returnComparisonReducer(state = initialState, action) {
  switch (action.type) {
    case GET_RETURN_COMPARISON_START:
      return {
        ...state,
        loading: true,
      };
    case GET_RETURN_COMPARISON_SUCCESS:
      return {
        ...state,
        loading: false,
        actualPercentage: action.actualPercentage,
        estonianPercentage: action.estonianPercentage,
        marketPercentage: action.marketPercentage,
      };
    case GET_RETURN_COMPARISON_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case LOG_OUT:
      return initialState;
    default:
      return state;
  }
}
