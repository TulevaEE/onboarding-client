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
});
