import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
} from './constants';
import initialState from './initialState';

export default function thirdPillarReducer(state = initialState, action) {
  const { type, query, monthlyContribution, exchangeExistingUnits } = action;

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
      return {
        ...state,
        monthlyContribution,
      };
    case CHANGE_EXCHANGE_EXISTING_UNITS:
      return {
        ...state,
        exchangeExistingUnits,
      };
    default:
      return state;
  }
}
