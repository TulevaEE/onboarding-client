import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
} from './constants';

export function addDataFromQueryParams(query) {
  return { type: QUERY_PARAMETERS, query };
}

export function changeMonthlyContribution(monthlyContribution) {
  return { type: CHANGE_MONTHLY_CONTRIBUTION, monthlyContribution };
}

export function changeExchangeExistingUnits(exchangeExistingUnits) {
  return { type: CHANGE_EXCHANGE_EXISTING_UNITS, exchangeExistingUnits };
}
