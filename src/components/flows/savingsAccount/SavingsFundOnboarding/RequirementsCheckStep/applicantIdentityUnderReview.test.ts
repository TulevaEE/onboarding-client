import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { applicantIdentityUnderReview } from './applicantIdentityUnderReview';

const withRelatedPersonErrors = (...errors: ValidationError[]) => ({
  ...mockValidatedCompany,
  relatedPersons: { value: mockValidatedCompany.relatedPersons.value, errors },
});

const OTHER_PERSONS_KYC_ERROR: ValidationError = {
  code: 'OTHER_RELATED_PERSONS_KYC',
  message: 'Isikusamasuse tuvastamine on lõpetamata',
};
const USER_KYC_ERROR: ValidationError = {
  code: 'USER_KYC',
  message: 'Sinu isikusamasuse tuvastamine on lõpetamata',
};

describe('applicantIdentityUnderReview', () => {
  it('is true when the applicant`s own verification is the one outstanding', () => {
    expect(applicantIdentityUnderReview(withRelatedPersonErrors(USER_KYC_ERROR))).toBe(true);
  });

  it('is true when the applicant`s own verification is outstanding alongside another person`s', () => {
    expect(
      applicantIdentityUnderReview(
        withRelatedPersonErrors(USER_KYC_ERROR, OTHER_PERSONS_KYC_ERROR),
      ),
    ).toBe(true);
  });

  it('is false when only other people are unverified', () => {
    expect(applicantIdentityUnderReview(withRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR))).toBe(
      false,
    );
  });

  it('is false when nothing is outstanding at all', () => {
    expect(applicantIdentityUnderReview(mockValidatedCompany)).toBe(false);
  });
});
