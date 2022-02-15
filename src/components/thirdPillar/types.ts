import { Fund, HttpError } from '../common/apiModels';

export type ThirdPillar = {
  monthlyContribution: number;
  sourceFunds: Fund[];
  loadingSourceFunds: boolean;
  loadingTargetFunds: boolean;
  exchangeableSourceFunds: Fund[];
  targetFunds: Fund[];
  selectedFutureContributionsFundIsin: string;
  exchangeExistingUnits: boolean;
  agreedToTerms: boolean;
  signedMandateId: number;
  error: HttpError;
};
