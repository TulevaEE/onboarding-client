import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';

export const hasNoValidationErrors = (data: BusinessRegistryValidatedData): boolean =>
  Object.values(data).every((field) => field.errors.length === 0);
