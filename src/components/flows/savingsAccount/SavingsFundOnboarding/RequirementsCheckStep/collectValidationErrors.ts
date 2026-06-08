import {
  BusinessRegistryValidatedData,
  ValidationError,
} from '../../../../common/apiModels/company-onboarding';

export const errorMessage = (error: ValidationError): string =>
  typeof error === 'string' ? error : error.message;

export const collectValidationErrors = (data: BusinessRegistryValidatedData): string[] =>
  Object.values(data)
    .flatMap((field) => field.errors)
    .map(errorMessage);
