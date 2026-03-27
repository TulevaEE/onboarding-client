import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { collectValidationErrors } from './collectValidationErrors';

describe('collectValidationErrors', () => {
  it('returns empty array when no fields have errors', () => {
    expect(collectValidationErrors(mockValidatedCompany)).toEqual([]);
  });

  it('returns errors from fields that have them', () => {
    const data = {
      ...mockValidatedCompany,
      status: { value: 'INVALID', errors: ['Company status is invalid'] },
      naceCode: { value: '', errors: ['NACE code is not allowed'] },
    };
    expect(collectValidationErrors(data)).toEqual([
      'Company status is invalid',
      'NACE code is not allowed',
    ]);
  });
});
