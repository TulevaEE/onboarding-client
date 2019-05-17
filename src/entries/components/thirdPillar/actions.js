import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_RESIDENCY,
  CHANGE_POLITICALLY_EXPOSED,
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

export function changeAgreementToTerms(agreedToTerms) {
  return { type: CHANGE_AGREEMENT_TO_TERMS, agreedToTerms };
}

export function changeIsPoliticallyExposed(isPoliticallyExposed) {
  return { type: CHANGE_POLITICALLY_EXPOSED, isPoliticallyExposed };
}

export function changeIsResident(isResident) {
  return { type: CHANGE_RESIDENCY, isResident };
}
