import { AmlCheck, ErrorResponse } from '../common/apiModels';

export type Aml = {
  isPoliticallyExposed: boolean;
  isResident: boolean;
  occupation: string;
  loading: boolean;
  error: ErrorResponse | null;
  missingAmlChecks: AmlCheck[];
  createAmlChecksSuccess: boolean;
};
