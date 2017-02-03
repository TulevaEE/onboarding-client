import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SET_TRANSFER_FUTURE_CAPITAL,

  // TODO: write tests after demo
  SIGN_MANDATE_START,
  SIGN_MANDATE_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
} from './constants';

const initialState = {
  sourceFunds: null,
  loadingSourceFunds: false,
  sourceSelection: null,
  sourceSelectionExact: false,
  targetFunds: null,
  loadingTargetFunds: false,
  selectedTargetFund: null,
  transferFutureCapital: true,
  error: null,

  loadingMandate: false,
  mandateSigningControlCode: null,
  mandateSigningSuccessful: false,
  mandateSigningError: null,
};

// TODO: add actual isin once Tuleva becomes a pension fund.
const DEFAULT_SELECTED_TARGET_FUND_ISIN = 'AE123232334';

export default function exchangeReducer(state = initialState, action) {
  switch (action.type) {
    case GET_SOURCE_FUNDS_START:
      return { ...state, loadingSourceFunds: true, error: null };
    case GET_SOURCE_FUNDS_SUCCESS:
      return {
        ...state,
        loadingSourceFunds: false,
        sourceFunds: action.sourceFunds,
        sourceSelection: action.sourceFunds
          .map(({ name, isin }) => ({ name, isin, percentage: 1 })),
      };
    case GET_SOURCE_FUNDS_ERROR:
      return { ...state, loadingSourceFunds: false, error: action.error };
    case SELECT_EXCHANGE_SOURCES:
      return {
        ...state,
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
      };

    case GET_TARGET_FUNDS_START:
      return { ...state, loadingTargetFunds: true, error: null };
    case GET_TARGET_FUNDS_SUCCESS:
      return {
        ...state,
        loadingTargetFunds: false,
        targetFunds: action.targetFunds,
        selectedTargetFund: action.targetFunds
          .reduce((foundFund, current) => foundFund ||
            (current.isin === DEFAULT_SELECTED_TARGET_FUND_ISIN ? current : null), null),
      };
    case GET_TARGET_FUNDS_ERROR:
      return { ...state, loadingTargetFunds: false, error: action.error };
    case SELECT_TARGET_FUND:
      return { ...state, selectedTargetFund: action.targetFund };

    case SET_TRANSFER_FUTURE_CAPITAL:
      return { ...state, transferFutureCapital: action.transferFutureCapital };

    // TODO: test the following actions after demo

    case SIGN_MANDATE_START:
      return { ...state, loadingMandate: true, mandateSigningError: null };
    case SIGN_MANDATE_START_SUCCESS:
      return { ...state, mandateSigningControlCode: action.controlCode, loadingMandate: false };
    case SIGN_MANDATE_SUCCESS:
      return { ...state, mandateSigningControlCode: null, mandateSigningSuccessful: true };

    case SIGN_MANDATE_START_ERROR: // fallthrough
    case SIGN_MANDATE_ERROR:
      return {
        ...state,
        loadingMandate: false,
        mandateSigningControlCode: null,
        mandateSigningError: action.error,
      };

    default:
      return state;
  }
}
