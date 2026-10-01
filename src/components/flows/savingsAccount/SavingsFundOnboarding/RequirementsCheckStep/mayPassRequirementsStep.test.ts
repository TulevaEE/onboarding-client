import { mockValidatedCompany } from '../../../../../test/backend-responses';
import {
  BusinessRegistryValidatedData,
  ValidationError,
} from '../../../../common/apiModels/company-onboarding';
import { mayPassRequirementsStep } from './mayPassRequirementsStep';

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
const COMPANY_CHECK_ERROR: ValidationError = {
  code: 'COMPANY_ACTIVE',
  message: 'Company status is invalid',
};

const fieldNames = Object.keys(mockValidatedCompany) as (keyof BusinessRegistryValidatedData)[];

describe('mayPassRequirementsStep', () => {
  it('is true when nothing is outstanding at all', () => {
    expect(mayPassRequirementsStep(mockValidatedCompany)).toBe(true);
  });

  it('is true when the only thing outstanding is another person`s verification', () => {
    expect(mayPassRequirementsStep(withRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR))).toBe(true);
  });

  it('is true when the applicant`s own verification is the one outstanding', () => {
    expect(mayPassRequirementsStep(withRelatedPersonErrors(USER_KYC_ERROR))).toBe(true);
  });

  it('is true when both kinds of verification are outstanding', () => {
    expect(
      mayPassRequirementsStep(withRelatedPersonErrors(USER_KYC_ERROR, OTHER_PERSONS_KYC_ERROR)),
    ).toBe(true);
  });

  it('is false when the company fails a check of its own alongside a verification', () => {
    const data = {
      ...withRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR),
      status: { value: 'INVALID', errors: [COMPANY_CHECK_ERROR] },
    };

    expect(mayPassRequirementsStep(data)).toBe(false);
  });

  it.each(fieldNames)('is false when the report flags %s', (fieldName) => {
    const data = {
      ...mockValidatedCompany,
      [fieldName]: { ...mockValidatedCompany[fieldName], errors: [COMPANY_CHECK_ERROR] },
    };

    expect(mayPassRequirementsStep(data)).toBe(false);
  });

  it('is true for a report that does not describe one of the fields', () => {
    const reportWithoutNaceCode = {
      ...mockValidatedCompany,
      naceCode: undefined,
    } as unknown as BusinessRegistryValidatedData;

    expect(mayPassRequirementsStep(reportWithoutNaceCode)).toBe(true);
  });
});
