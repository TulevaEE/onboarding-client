import {
  LOAD_PENSION_DATA_SUCCESS,
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,
  SELECT_TARGET_FUND,
  CHANGE_AGREEMENT_TO_TERMS,

  // NOTE: maybe we should move this state to a separate mandate reducer?
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_SMART_ID_START_SUCCESS,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_IN_PROGRESS,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
  NO_SIGN_MANDATE_ERROR,
  SET_CANCELLATION_MANDATE_ID,
} from './constants';

import {
  ID_CARD_AUTHENTICATION_SUCCESS,
  LOG_OUT,
  MOBILE_AUTHENTICATION_SUCCESS,
} from '../login/constants';
import { isTuleva } from '../common/utils';

const initialState = {
  loadingPensionData: true,
  sourceFunds: null,
  loadingSourceFunds: false,
  sourceSelection: [],
  sourceSelectionExact: false,
  targetFunds: null,
  loadingTargetFunds: false,
  selectedFutureContributionsFundIsin: null,
  error: null,

  loadingMandate: false,
  mandateSigningControlCode: null,
  mandateSigningError: null,
  signedMandateId: null,
  cancellationMandateId: null,
  agreedToTerms: false,
};

function getCurrentCompanyFunds(targetFunds) {
  if (!targetFunds) {
    return [];
  }
  const currentCompanyFunds = targetFunds.filter((fund) => isTuleva(fund));
  if (currentCompanyFunds.length === 0) {
    throw new Error('Could not find current company funds in target funds');
  }

  return currentCompanyFunds;
}

function createFullDefaultSourceSelection({ sourceFunds, targetFunds }) {
  const currentCompanyFunds = getCurrentCompanyFunds(targetFunds);
  const targetFundIsin = currentCompanyFunds[0].isin;

  return sourceFunds
    .filter((fund) => fund.isin !== targetFundIsin)
    .filter((fund) => fund.price > 0)
    .map(({ isin }) => ({
      sourceFundIsin: isin,
      targetFundIsin,
      percentage: 1,
    }));
}

export function isContributionsFundAlreadyActive(sourceFunds, isinToCompareTo) {
  return (
    sourceFunds &&
    !!sourceFunds.find((sourceFund) => sourceFund.activeFund && sourceFund.isin === isinToCompareTo)
  );
}

function getContributionFundIsin(action, state) {
  if (!action.sourceSelectionExact && action.sourceSelection.length > 0) {
    return action.sourceSelection[0].targetFundIsin;
  }
  return state.selectedFutureContributionsFundIsin;
}

function selectDefaultContributionsFund(targetFunds, sourceFunds) {
  const currentCompanyFunds = getCurrentCompanyFunds(targetFunds);
  if (sourceFunds && targetFunds) {
    const futureContributionsFundCandidate = currentCompanyFunds[0].isin;
    return isContributionsFundAlreadyActive(sourceFunds, futureContributionsFundCandidate)
      ? null
      : futureContributionsFundCandidate;
  }
  return null;
}

function isSourceSelectionDone(sourceSelection) {
  return sourceSelection && sourceSelection.length > 0;
}

export default function exchangeReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_PENSION_DATA_SUCCESS:
      return { ...state, loadingPensionData: false };
    case GET_SOURCE_FUNDS_START:
      return { ...state, loadingSourceFunds: true, error: null };
    case GET_SOURCE_FUNDS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const sourceFunds = action.sourceFunds
        .filter((fund) => fund.pillar === 2)
        .filter(
          (fund) => fund.price + fund.unavailablePrice > 0 || fund.activeFund || isTuleva(fund),
        );
      return {
        ...state,
        loadingSourceFunds: false,
        sourceFunds,
        // we do not know if source or target funds get here first, so we check if we can
        // calculate the default source selection and they have not yet been calculated in
        // both the target and source fund arrival
        sourceSelection:
          state.targetFunds && !isSourceSelectionDone(state.sourceSelection)
            ? createFullDefaultSourceSelection({
                sourceFunds,
                targetFunds: state.targetFunds,
              })
            : state.sourceSelection,
        selectedFutureContributionsFundIsin: selectDefaultContributionsFund(
          state.targetFunds,
          action.sourceFunds,
        ),
      };
    case GET_SOURCE_FUNDS_ERROR:
      return { ...state, loadingSourceFunds: false, error: action.error };
    case SELECT_EXCHANGE_SOURCES:
      return {
        ...state,
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
        selectedFutureContributionsFundIsin: getContributionFundIsin(action, state),
      };

    case GET_TARGET_FUNDS_START:
      return { ...state, loadingTargetFunds: true, error: null };
    case GET_TARGET_FUNDS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const secondPillarTargetFunds = action.targetFunds.filter(
        (fund) => fund.pillar === 2 && fund.status === 'ACTIVE',
      );
      return {
        ...state,
        loadingTargetFunds: false,
        targetFunds: secondPillarTargetFunds,
        selectedFutureContributionsFundIsin: selectDefaultContributionsFund(
          secondPillarTargetFunds,
          state.sourceFunds,
        ),
        // we do not know if source or target funds get here first, so we check if we can
        // calculate the default source selection and they have not yet been calculated in
        // both the target and source fund arrival
        sourceSelection:
          state.sourceFunds && !isSourceSelectionDone(state.sourceSelection)
            ? createFullDefaultSourceSelection({
                sourceFunds: state.sourceFunds,
                targetFunds: secondPillarTargetFunds,
              })
            : state.sourceSelection,
      };
    case GET_TARGET_FUNDS_ERROR:
      return { ...state, loadingTargetFunds: false, error: action.error };
    case SELECT_TARGET_FUND:
      return {
        ...state,
        selectedFutureContributionsFundIsin: action.targetFundIsin,
      };

    case SIGN_MANDATE_MOBILE_ID_START:
    case SIGN_MANDATE_SMART_ID_START:
    case SIGN_MANDATE_ID_CARD_START:
      return { ...state, loadingMandate: true, mandateSigningError: null };
    case SIGN_MANDATE_MOBILE_ID_START_SUCCESS:
    case SIGN_MANDATE_SMART_ID_START_SUCCESS:
    case SIGN_MANDATE_IN_PROGRESS:
      return {
        ...state,
        mandateSigningControlCode: action.controlCode,
        loadingMandate: action.controlCode == null,
      };
    case SIGN_MANDATE_SUCCESS:
      return {
        ...state,
        mandateSigningControlCode: null,
        signedMandateId: action.pillar === 2 ? action.signedMandateId : null,
        loadingMandate: false,
      };

    case SIGN_MANDATE_START_ERROR: // fallthrough
    case SIGN_MANDATE_ERROR:
      return {
        ...state,
        loadingMandate: false,
        mandateSigningControlCode: null,
        mandateSigningError: action.error,
      };
    case SIGN_MANDATE_INVALID_ERROR:
      return {
        ...state,
        loadingMandate: false,
        mandateSigningControlCode: null,
        mandateSigningError: action.error,
      };
    case SIGN_MANDATE_MOBILE_ID_CANCEL:
      return {
        ...state,
        loadingMandate: false,
        mandateSigningControlCode: null,
        signedMandateId: null,
        cancellationMandateId: null,
      };

    case SET_CANCELLATION_MANDATE_ID:
      return {
        ...state,
        cancellationMandateId: action.mandateId,
      };

    case CHANGE_AGREEMENT_TO_TERMS:
      return {
        ...state,
        agreedToTerms: action.agreement,
      };

    case MOBILE_AUTHENTICATION_SUCCESS:
    case ID_CARD_AUTHENTICATION_SUCCESS:
    case LOG_OUT:
      return initialState;
    case NO_SIGN_MANDATE_ERROR:
      return {
        ...state,
        mandateSigningError: null,
      };
    default:
      return state;
  }
}
