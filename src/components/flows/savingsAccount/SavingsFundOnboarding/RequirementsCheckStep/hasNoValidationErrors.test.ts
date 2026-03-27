import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { hasNoValidationErrors } from './hasNoValidationErrors';

describe('hasNoValidationErrors', () => {
  it('returns true when naceCode, status, and legalForm have no errors', () => {
    expect(hasNoValidationErrors(mockValidatedCompany)).toBe(true);
  });

  it('returns false when status has errors', () => {
    const data = {
      ...mockValidatedCompany,
      status: { value: 'INVALID', errors: ['INVALID_STATUS'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when legalForm has errors', () => {
    const data = {
      ...mockValidatedCompany,
      legalForm: { value: 'XX', errors: ['INVALID_LEGAL_FORM'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when naceCode has errors', () => {
    const data = {
      ...mockValidatedCompany,
      naceCode: { value: '', errors: ['INVALID_NACE_CODE'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when name has errors', () => {
    const data = {
      ...mockValidatedCompany,
      name: { value: 'Test', errors: ['INVALID_NAME'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when registryCode has errors', () => {
    const data = {
      ...mockValidatedCompany,
      registryCode: { value: '123', errors: ['INVALID_REGISTRY_CODE'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when address has errors', () => {
    const data = {
      ...mockValidatedCompany,
      address: { ...mockValidatedCompany.address, errors: ['INVALID_ADDRESS'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when businessActivity has errors', () => {
    const data = {
      ...mockValidatedCompany,
      businessActivity: { value: 'UNKNOWN', errors: ['INVALID_BUSINESS_ACTIVITY'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when foundingDate has errors', () => {
    const data = {
      ...mockValidatedCompany,
      foundingDate: { value: '2020-01-01', errors: ['INVALID_FOUNDING_DATE'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when relatedPersons has errors', () => {
    const data = {
      ...mockValidatedCompany,
      relatedPersons: { ...mockValidatedCompany.relatedPersons, errors: ['INVALID_PERSONS'] },
    };
    expect(hasNoValidationErrors(data)).toBe(false);
  });
});
