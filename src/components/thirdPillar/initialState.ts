export const TULEVA_3RD_PILLAR_FUND_ISIN = 'EE3600001707';
export const EXIT_RESTRICTED_FUNDS = ['EE3600109484', 'EE3600001749', 'EE3600001731'];

export default {
  monthlyContribution: null,
  sourceFunds: [],
  loadingSourceFunds: false,
  loadingTargetFunds: false,
  exchangeableSourceFunds: null,
  targetFunds: [],
  funds: null,
  selectedFutureContributionsFundIsin: TULEVA_3RD_PILLAR_FUND_ISIN,
  exchangeExistingUnits: true,
  agreedToTerms: false,
  signedMandateId: null,
  error: null,
  recurringPaymentCount: 0,
};
