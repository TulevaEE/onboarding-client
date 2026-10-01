import {
  BusinessRegistryValidatedData,
  ValidationError,
} from '../../../../common/apiModels/company-onboarding';

export const errorMessage = (error: ValidationError): string => error.message;

export const errorCode = (error: ValidationError): string => error.code;

export const collectErrors = (data: BusinessRegistryValidatedData): ValidationError[] =>
  Object.values(data).flatMap((field) => field?.errors ?? []);
