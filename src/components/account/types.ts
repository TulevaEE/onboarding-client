import { ErrorResponse, InitialCapital } from '../common/apiModels';

export type Account = {
  initialCapital: InitialCapital;
  loadingInitialCapital: boolean;
  error: ErrorResponse;
};
