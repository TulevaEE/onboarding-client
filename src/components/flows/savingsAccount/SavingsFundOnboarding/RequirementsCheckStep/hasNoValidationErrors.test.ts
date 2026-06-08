import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { hasNoValidationErrors } from './hasNoValidationErrors';

const anError: ValidationError = { code: 'COMPANY_ACTIVE', message: 'Invalid' };

describe('hasNoValidationErrors', () => {
  it('returns true when naceCode, status, and legalForm have no errors', () => {
    expect(hasNoValidationErrors(mockValidatedCompany)).toBe(true);
  });

  it('returns false when status has errors', () => {
    const data = {
      ...mockValidatedCompany,
      status: { value: 'INVALID', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when legalForm has errors', () => {
    const data = {
      ...mockValidatedCompany,
      legalForm: { value: 'XX', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when naceCode has errors', () => {
    const data = {
      ...mockValidatedCompany,
      naceCode: { value: '', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when name has errors', () => {
    const data = {
      ...mockValidatedCompany,
      name: { value: 'Test', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when registryCode has errors', () => {
    const data = {
      ...mockValidatedCompany,
      registryCode: { value: '123', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when address has errors', () => {
    const data = {
      ...mockValidatedCompany,
      address: { ...mockValidatedCompany.address, errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when businessActivity has errors', () => {
    const data = {
      ...mockValidatedCompany,
      businessActivity: { value: 'UNKNOWN', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when foundingDate has errors', () => {
    const data = {
      ...mockValidatedCompany,
      foundingDate: { value: '2020-01-01', errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when relatedPersons has errors', () => {
    const data = {
      ...mockValidatedCompany,
      relatedPersons: { ...mockValidatedCompany.relatedPersons, errors: [anError] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });
});
