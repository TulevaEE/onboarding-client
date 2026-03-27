import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';

export const collectValidationErrors = (data: BusinessRegistryValidatedData): unknown[] =>
  Object.values(data).flatMap((field) => field.errors);
