import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
} from './constants';

const initialState = {
  pensionFunds: null,
  loadingPensionFunds: false,
  error: null,
};

export default function exchangeReducer(state = initialState, action) {
  switch (action.type) {
    case GET_PENSION_FUNDS_START:
      return { ...state, loadingPensionFunds: true, error: null };
    case GET_PENSION_FUNDS_SUCCESS:
      return { ...state, loadingPensionFunds: false, pensionFunds: action.pensionFunds };
    case GET_PENSION_FUNDS_ERROR:
      return { ...state, loadingPensionFunds: false, error: action.error };
    default:
      return state;
  }
}
