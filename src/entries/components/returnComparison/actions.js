import {
  GET_RETURN_COMPARISON_START,
  GET_RETURN_COMPARISON_SUCCESS,
  GET_RETURN_COMPARISON_ERROR,
} from './constants';
import { getReturnComparisonForStartDateWithToken } from '../common/api';

export function getReturnComparisonForStartDate(date) {
  return async (dispatch, getState) => {
    dispatch({ type: GET_RETURN_COMPARISON_START });
    try {
      const {
        actualReturnPercentage: actualPercentage,
        estonianAverageReturnPercentage: estonianPercentage,
        marketAverageReturnPercentage: marketPercentage,
      } = await getReturnComparisonForStartDateWithToken(date, getState().login.token);
      dispatch({
        type: GET_RETURN_COMPARISON_SUCCESS,
        actualPercentage,
        estonianPercentage,
        marketPercentage,
      });
    } catch (error) {
      dispatch({ type: GET_RETURN_COMPARISON_ERROR, error });
    }
  };
}
