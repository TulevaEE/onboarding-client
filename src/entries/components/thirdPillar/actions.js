import {
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_MONTHLY_CONTRIBUTION,
  QUERY_PARAMETERS,
  SELECT_THIRD_PILLAR_SOURCES,
  THIRD_PILLAR_STATISTICS,
} from './constants';
import { postThirdPillarStatistics } from '../common/api';

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

export function thirdPillarStatistics(statistics) {
  return (dispatch, getState) => {
    if (statistics.mandateId == null) {
      return Promise.resolve();
    }
    return postThirdPillarStatistics(statistics, getState().login.token).then(
      (returnedStatistics) => {
        dispatch({
          type: THIRD_PILLAR_STATISTICS,
          statistics: returnedStatistics,
        });
      },
    );
  };
}

export function selectThirdPillarSources(
  exchangeExistingUnits,
  selectedFutureContributionsFundIsin,
) {
  return {
    type: SELECT_THIRD_PILLAR_SOURCES,
    exchangeExistingUnits,
    selectedFutureContributionsFundIsin,
  };
}
