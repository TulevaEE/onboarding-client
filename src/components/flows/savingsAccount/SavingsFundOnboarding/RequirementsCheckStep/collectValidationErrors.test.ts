import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { collectValidationErrors } from './collectValidationErrors';

describe('collectValidationErrors', () => {
  it('returns empty array when no fields have errors', () => {
    expect(collectValidationErrors(mockValidatedCompany)).toEqual([]);
  });

  it('returns the messages from fields that have errors', () => {
    const data = {
      ...mockValidatedCompany,
      status: {
        value: 'INVALID',
        errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
      },
      naceCode: {
        value: '',
        errors: [{ code: 'HIGH_RISK_NACE', message: 'NACE code is not allowed' }],
      },
    };
    expect(collectValidationErrors(data)).toEqual([
      'Company status is invalid',
      'NACE code is not allowed',
    ]);
  });
});
