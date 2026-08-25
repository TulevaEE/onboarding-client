import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { onlyIdentityVerificationMissing } from './onlyIdentityVerificationMissing';

const withRelatedPersonErrors = (...errors: ValidationError[]) => ({
  ...mockValidatedCompany,
  relatedPersons: { value: mockValidatedCompany.relatedPersons.value, errors },
});

const KYC_ERROR: ValidationError = {
  code: 'OTHER_RELATED_PERSONS_KYC',
  message: 'Isikusamasuse tuvastamine on lõpetamata',
};
const USER_KYC_ERROR: ValidationError = {
  code: 'USER_KYC',
  message: 'Sinu isikusamasuse tuvastamine on lõpetamata',
};

describe('onlyIdentityVerificationMissing', () => {
  it('is true when the only thing outstanding is another person`s verification', () => {
    expect(onlyIdentityVerificationMissing(withRelatedPersonErrors(KYC_ERROR))).toBe(true);
  });

  it('is true when the applicant`s own verification is the one outstanding', () => {
    expect(onlyIdentityVerificationMissing(withRelatedPersonErrors(USER_KYC_ERROR))).toBe(true);
  });

  it('is true when both kinds of verification are outstanding', () => {
    expect(
      onlyIdentityVerificationMissing(withRelatedPersonErrors(USER_KYC_ERROR, KYC_ERROR)),
    ).toBe(true);
  });

  // The company itself does not fit, so letting the applicant fill in the rest
  // would only waste their time.
  it('is false when the company fails a check of its own', () => {
    const data = {
      ...withRelatedPersonErrors(KYC_ERROR),
      status: {
        value: 'INVALID',
        errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
      },
    };

    expect(onlyIdentityVerificationMissing(data)).toBe(false);
  });

  it('is false when nothing is outstanding at all', () => {
    expect(onlyIdentityVerificationMissing(mockValidatedCompany)).toBe(false);
  });
});
