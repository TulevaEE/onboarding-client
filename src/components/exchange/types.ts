import { Fund, SourceFund } from '../common/apiModels';

export type Exchange = {
  loadingPensionData: boolean;
  sourceFunds: SourceFund[] | null;
  loadingSourceFunds: boolean;
  sourceSelection: SourceSelection[];
  sourceSelectionExact: boolean;
  targetFunds: Fund[] | null;
  loadingTargetFunds: boolean;
  selectedFutureContributionsFundIsin: string;
  error: string;
  loadingMandate: boolean;
  mandateSigningControlCode: string;
  mandateSigningError: string;
  signedMandateId: boolean;
  agreedToTerms: boolean;
};

type SourceSelection = {
  sourceFundIsin: string;
  targetFundIsin: string;
  percentage: number;
};
