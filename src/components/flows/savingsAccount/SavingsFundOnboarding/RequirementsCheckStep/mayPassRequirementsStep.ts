import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';
import { collectErrors, errorCode } from './collectValidationErrors';
import { IDENTITY_KYC_CODES } from './kycErrorCodes';

export const mayPassRequirementsStep = (data: BusinessRegistryValidatedData): boolean =>
  collectErrors(data).every((error) => IDENTITY_KYC_CODES.includes(errorCode(error)));
