import { mockValidatedCompany } from '../../../../../test/backend-responses';
import {
  BusinessRegistryValidatedData,
  ValidationError,
} from '../../../../common/apiModels/company-onboarding';
import { collectErrors } from './collectValidationErrors';

const statusError: ValidationError = {
  code: 'COMPANY_ACTIVE',
  message: 'Company status is invalid',
};
const naceError: ValidationError = { code: 'HIGH_RISK_NACE', message: 'NACE code is not allowed' };

const withStatusAndNaceErrors = {
  ...mockValidatedCompany,
  status: { value: 'INVALID', errors: [statusError] },
  naceCode: { value: '', errors: [naceError] },
};

describe('collectErrors', () => {
  it('gathers the errors of every field', () => {
    expect(collectErrors(withStatusAndNaceErrors)).toEqual([statusError, naceError]);
  });

  it('survives a report that does not describe one of the fields', () => {
    const reportWithoutNaceCode = {
      ...mockValidatedCompany,
      naceCode: undefined,
    } as unknown as BusinessRegistryValidatedData;

    expect(collectErrors(reportWithoutNaceCode)).toEqual([]);
  });
});
