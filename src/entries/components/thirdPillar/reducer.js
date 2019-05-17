import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_AGREEMENT_TO_TERMS,
} from './constants';
import initialState from './initialState';
import { GET_SOURCE_FUNDS_SUCCESS, GET_TARGET_FUNDS_SUCCESS } from '../exchange/constants';

export default function thirdPillarReducer(state = initialState, action) {
  const { type, query, monthlyContribution } = action;

  switch (type) {
    case QUERY_PARAMETERS:
      return {
        ...state,
        monthlyContribution:
          parseInt(query.monthlyThirdPillarContribution, 10) || state.monthlyContribution || null,
        exchangeExistingUnits:
          query.exchangeExistingThirdPillarUnits === 'true' || state.exchangeExistingUnits,
      };
    case CHANGE_MONTHLY_CONTRIBUTION:
      return { ...state, monthlyContribution };
    case CHANGE_EXCHANGE_EXISTING_UNITS:
      return { ...state, exchangeExistingUnits: action.exchangeExistingUnits };
    case GET_SOURCE_FUNDS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const sourceFunds = action.sourceFunds.filter(isThirdPillar);
      // eslint-disable-next-line no-case-declarations
      const exchangeExistingUnits = sourceFunds.length === 0 ? false : state.exchangeExistingUnits;

      return { ...state, sourceFunds, exchangeExistingUnits };
    case GET_TARGET_FUNDS_SUCCESS:
      return {
        ...state,
        targetFunds: action.targetFunds.filter(isThirdPillar),
      };
    case CHANGE_AGREEMENT_TO_TERMS:
      return {
        ...state,
        agreedToTerms: action.agreedToTerms,
      };
    default:
      return state;
  }
}

function isThirdPillar(fund) {
  return fund.pillar === 3;
}
