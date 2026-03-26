import { BusinessRegistryValidatedData } from '../../../../common/apiModels/savings-fund';
import { hasNoValidationErrors } from './hasNoValidationErrors';

const validData: BusinessRegistryValidatedData = {
  name: { value: 'Test OÜ', errors: [] },
  registryCode: { value: '11223344', errors: [] },
  status: { value: 'REGISTERED', errors: [] },
  address: {
    value: {
      fullAddress: 'Telliskivi 60/1, 10412 Tallinn',
      street: 'Telliskivi 60/1',
      city: 'Tallinn',
      postalCode: '10412',
      countryCode: 'EST',
    },
    errors: [],
  },
  businessActivity: { value: 'Arvutialased konsultatsioonid', errors: [] },
  legalForm: { value: 'OÜ', errors: [] },
  naceCode: { value: '62.02', errors: [] },
  foundingDate: { value: '2026-02-15', errors: [] },
  relatedPersons: {
    value: [
      {
        personalCode: '40404049996',
        name: 'Person McPerson',
        boardMember: false,
        shareholder: false,
        beneficialOwner: false,
        ownershipPercent: null,
        kycStatus: 'UNKNOWN',
      },
    ],
    errors: [],
  },
};

describe('hasNoValidationErrors', () => {
  it('returns true when naceCode, status, and legalForm have no errors', () => {
    expect(hasNoValidationErrors(validData)).toBe(true);
  });

  it('returns false when status has errors', () => {
    const data = { ...validData, status: { value: 'INVALID', errors: ['INVALID_STATUS'] } };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when legalForm has errors', () => {
    const data = { ...validData, legalForm: { value: 'XX', errors: ['INVALID_LEGAL_FORM'] } };
    expect(hasNoValidationErrors(data)).toBe(false);
  });

  it('returns false when naceCode has errors', () => {
    const data = { ...validData, naceCode: { value: '', errors: ['INVALID_NACE_CODE'] } };
    expect(hasNoValidationErrors(data)).toBe(false);
  });
});
