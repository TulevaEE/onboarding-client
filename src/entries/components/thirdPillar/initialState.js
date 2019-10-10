export const LHV_INDEX_PLUS_ISIN = 'EE3600109419';
export const TULEVA_3RD_PILLAR_FUND_ISIN = 'EE3600001707';

export default {
  monthlyContribution: null,
  sourceFunds: [],
  loadingSourceFunds: false,
  exchangeableSourceFunds: null,
  targetFunds: [],
  selectedFutureContributionsFundIsin: LHV_INDEX_PLUS_ISIN || TULEVA_3RD_PILLAR_FUND_ISIN,
  exchangeExistingUnits: true,
  agreedToTerms: false,
  isResident: null,
  isPoliticallyExposed: null,
  signedMandateId: null,
  statistics: {},
};
