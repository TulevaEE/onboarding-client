import { ErrorResponse, Fund, SourceFund } from '../common/apiModels';

export type Exchange = {
  loadingPensionData: boolean;
  sourceFunds: SourceFund[] | null;
  loadingSourceFunds: boolean;
  sourceSelection: SourceSelection[];
  sourceSelectionExact: boolean;
  targetFunds: Fund[] | null;
  loadingTargetFunds: boolean;
  selectedFutureContributionsFundIsin: string;
  error: ErrorResponse | null;
  loadingMandate: boolean;
  mandateSigningControlCode: string;
  mandateSigningError: ErrorResponse | null;
  signedMandateId: boolean;
  agreedToTerms: boolean;
};

export type SourceSelection = {
  sourceFundIsin: string;
  targetFundIsin: string;
  percentage: number;
};
