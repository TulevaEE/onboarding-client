import { AmlCheck, HttpError } from '../common/apiModels';

export type Aml = {
  isPoliticallyExposed: boolean;
  isResident: boolean;
  occupation: string;
  loading: boolean;
  error: HttpError;
  missingAmlChecks: AmlCheck[];
  createAmlChecksSuccess: boolean;
};
