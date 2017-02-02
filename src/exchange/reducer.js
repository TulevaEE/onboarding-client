import {
  GET_EXISTING_PENSION_FUNDS_START,
  GET_EXISTING_PENSION_FUNDS_SUCCESS,
  GET_EXISTING_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
} from './constants';

const initialState = {
  sourceFunds: null,
  loadingSourceFunds: false,
  sourceSelection: null,
  sourceSelectionExact: false,
  error: null,
};

export default function exchangeReducer(state = initialState, action) {
  switch (action.type) {
    case GET_EXISTING_PENSION_FUNDS_START:
      return { ...state, loadingSourceFunds: true, error: null };
    case GET_EXISTING_PENSION_FUNDS_SUCCESS:
      return {
        ...state,
        loadingSourceFunds: false,
        sourceFunds: action.sourceFunds,
        sourceSelection: action.sourceFunds
          .map(({ name, isin }) => ({ name, isin, percentage: 1 })),
      };
    case GET_EXISTING_PENSION_FUNDS_ERROR:
      return { ...state, loadingSourceFunds: false, error: action.error };
    case SELECT_EXCHANGE_SOURCES:
      return {
        ...state,
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
      };
    default:
      return state;
  }
}
