import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE,
} from './constants';

const initialState = {
  pensionFunds: null,
  loadingPensionFunds: false,
  selection: null,
  selectedSome: false, // if the user has not selected all or none
  error: null,
};

export default function exchangeReducer(state = initialState, action) {
  switch (action.type) {
    case GET_PENSION_FUNDS_START:
      return { ...state, loadingPensionFunds: true, error: null };
    case GET_PENSION_FUNDS_SUCCESS:
      return {
        ...state,
        loadingPensionFunds: false,
        pensionFunds: action.pensionFunds,
        selection: action.pensionFunds.map(({ name, isin }) => ({ name, isin, percentage: 1 })),
      };
    case GET_PENSION_FUNDS_ERROR:
      return { ...state, loadingPensionFunds: false, error: action.error };
    case SELECT_EXCHANGE:
      return { ...state, selection: action.exchange, selectedSome: !!action.selectedSome };
    default:
      return state;
  }
}
