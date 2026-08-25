import { BusinessRegistryValidatedData } from '../../../../common/apiModels/company-onboarding';
import { errorCode } from './collectValidationErrors';

export const USER_KYC_CODE = 'USER_KYC';
export const OTHER_RELATED_PERSONS_KYC_CODE = 'OTHER_RELATED_PERSONS_KYC';
export const IDENTITY_KYC_CODES = [USER_KYC_CODE, OTHER_RELATED_PERSONS_KYC_CODE];

export const onlyIdentityVerificationMissing = (data: BusinessRegistryValidatedData): boolean => {
  const errors = Object.values(data).flatMap((field) => field?.errors ?? []);
  return (
    errors.length > 0 && errors.every((error) => IDENTITY_KYC_CODES.includes(errorCode(error)))
  );
};
