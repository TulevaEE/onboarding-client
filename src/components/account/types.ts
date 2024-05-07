import { CapitalRow, ErrorResponse } from '../common/apiModels';

export type Account = {
  initialCapital: CapitalRow[];
  loadingInitialCapital: boolean;
  error: ErrorResponse;
};
