import {
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_OCCUPATION,
  CHANGE_POLITICALLY_EXPOSED,
  CHANGE_RESIDENCY,
  QUERY_PARAMETERS,
  SELECT_THIRD_PILLAR_SOURCES,
  THIRD_PILLAR_STATISTICS,
} from './constants';
import initialState, { EXIT_RESTRICTED_FUND } from './initialState';
import {
  GET_SOURCE_FUNDS_ERROR,
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_SUCCESS,
  SIGN_MANDATE_SUCCESS,
} from '../exchange/constants';
import { LOG_OUT } from '../login/constants';

export default function thirdPillarReducer(state = initialState, action) {
  const { type, query, monthlyContribution } = action;

  switch (type) {
    case QUERY_PARAMETERS:
      return {
        ...state,
        monthlyContribution:
          parseInt(query.monthlyThirdPillarContribution, 10) || state.monthlyContribution || null,
        exchangeExistingUnits:
          // eslint-disable-next-line no-nested-ternary
          query.exchangeExistingThirdPillarUnits === 'true'
            ? true
            : query.exchangeExistingThirdPillarUnits === 'false'
            ? false
            : state.exchangeExistingUnits,
      };
    case CHANGE_MONTHLY_CONTRIBUTION:
      return { ...state, monthlyContribution };
    case CHANGE_EXCHANGE_EXISTING_UNITS:
      return { ...state, exchangeExistingUnits: action.exchangeExistingUnits };
    case GET_SOURCE_FUNDS_START:
      return { ...state, loadingSourceFunds: true };
    case GET_SOURCE_FUNDS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const sourceFunds = action.sourceFunds
        .filter(isThirdPillar)
        .filter(fund => fund.price + fund.unavailablePrice > 0 || fund.activeFund);

      // eslint-disable-next-line no-case-declarations
      const exchangeableSourceFunds = sourceFunds
        .filter(fund => fund.price > 0)
        .filter(fund => fund.isin !== EXIT_RESTRICTED_FUND)
        .filter(fund => fund.isin !== state.selectedFutureContributionsFundIsin); // TODO: change source funds on selected change

      // eslint-disable-next-line no-case-declarations
      const exchangeExistingUnits =
        exchangeableSourceFunds.length === 0 ? false : state.exchangeExistingUnits;

      return {
        ...state,
        sourceFunds,
        exchangeableSourceFunds,
        exchangeExistingUnits,
        loadingSourceFunds: false,
      };
    case GET_SOURCE_FUNDS_ERROR:
      return {
        ...state,
        loadingSourceFunds: false,
        error: action.error,
        exchangeableSourceFunds: [],
      };
    case GET_TARGET_FUNDS_SUCCESS:
      return {
        ...state,
        targetFunds: action.targetFunds.filter(isThirdPillar).filter(isTuleva),
      };
    case CHANGE_AGREEMENT_TO_TERMS:
      return {
        ...state,
        agreedToTerms: action.agreedToTerms,
      };
    case CHANGE_POLITICALLY_EXPOSED:
      return {
        ...state,
        isPoliticallyExposed: action.isPoliticallyExposed,
      };
    case CHANGE_RESIDENCY:
      return {
        ...state,
        isResident: action.isResident,
      };
    case CHANGE_OCCUPATION:
      return {
        ...state,
        occupation: action.occupation,
      };
    case SIGN_MANDATE_SUCCESS:
      return {
        ...state,
        signedMandateId: action.signedMandateId,
      };
    case SELECT_THIRD_PILLAR_SOURCES:
      return {
        ...state,
        exchangeExistingUnits: action.exchangeExistingUnits,
        selectedFutureContributionsFundIsin: action.selectedFutureContributionsFundIsin,
      };
    case THIRD_PILLAR_STATISTICS:
      return {
        ...state,
        statistics: action.statistics,
      };
    case LOG_OUT:
      return initialState;
    default:
      return state;
  }
}

const isThirdPillar = fund => fund.pillar === 3;

const isTuleva = fund => (fund.fundManager || {}).name === 'Tuleva';
