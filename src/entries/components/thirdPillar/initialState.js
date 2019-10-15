export const TULEVA_3RD_PILLAR_FUND_ISIN = 'EE3600001707';
export const EXIT_RESTRICTED_FUND = 'EE3600109484';

export default {
  monthlyContribution: null,
  sourceFunds: [],
  loadingSourceFunds: false,
  exchangeableSourceFunds: null,
  targetFunds: [],
  selectedFutureContributionsFundIsin: TULEVA_3RD_PILLAR_FUND_ISIN,
  exchangeExistingUnits: true,
  agreedToTerms: false,
  isResident: null,
  isPoliticallyExposed: null,
  signedMandateId: null,
  statistics: {},
  error: null,
};
