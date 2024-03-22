import { Fund, ErrorResponse, SourceFund } from '../common/apiModels';

export type ThirdPillar = {
  monthlyContribution: number;
  sourceFunds: SourceFund[];
  loadingSourceFunds: boolean;
  loadingTargetFunds: boolean;
  exchangeableSourceFunds: Fund[];
  targetFunds: Fund[];
  funds: Fund[] | null;
  selectedFutureContributionsFundIsin: string;
  exchangeExistingUnits: boolean;
  agreedToTerms: boolean;
  signedMandateId: number;
  error: ErrorResponse;
  recurringPaymentCount: number;
};
