import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';

export const hasNoValidationErrors = (data: BusinessRegistryValidatedData): boolean =>
  [data.naceCode, data.status, data.legalForm].every((field) => field.errors.length === 0);
