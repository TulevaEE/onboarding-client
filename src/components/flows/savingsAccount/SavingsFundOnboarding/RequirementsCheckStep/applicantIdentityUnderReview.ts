import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';
import { collectErrors, errorCode } from './collectValidationErrors';
import { USER_KYC_CODE } from './kycErrorCodes';

export const applicantIdentityUnderReview = (data: BusinessRegistryValidatedData): boolean =>
  collectErrors(data).some((error) => errorCode(error) === USER_KYC_CODE);
