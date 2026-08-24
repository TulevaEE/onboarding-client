import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { unverifiedRelatedPersonNames } from './unverifiedRelatedPersonNames';

const kycError = (persons?: ValidationError['persons']): ValidationError => ({
  code: 'OTHER_RELATED_PERSONS_KYC',
  message: 'Isikusamasuse tuvastamine on lõpetamata',
  ...(persons ? { persons } : {}),
});

describe('unverifiedRelatedPersonNames', () => {
  it('reads the name of the person the backend named', () => {
    expect(
      unverifiedRelatedPersonNames([
        kycError([{ personalCode: '38001010000', name: 'Jaan Näidis' }]),
      ]),
    ).toEqual(['Jaan Näidis']);
  });

  it('reads several people', () => {
    expect(
      unverifiedRelatedPersonNames([
        kycError([
          { personalCode: '38001010000', name: 'Jaan Näidis' },
          { personalCode: '48001010000', name: 'Mari Näidis' },
        ]),
      ]),
    ).toEqual(['Jaan Näidis', 'Mari Näidis']);
  });

  it('falls back to the personal code when the backend has no name', () => {
    expect(
      unverifiedRelatedPersonNames([kycError([{ personalCode: '38001010000', name: null }])]),
    ).toEqual(['38001010000']);
  });

  it('falls back to the personal code when the name is empty', () => {
    expect(
      unverifiedRelatedPersonNames([kycError([{ personalCode: '38001010000', name: '' }])]),
    ).toEqual(['38001010000']);
  });

  it('finds nobody when the error carries no persons', () => {
    expect(unverifiedRelatedPersonNames([kycError()])).toEqual([]);
  });

  it('finds nobody when the persons list is empty', () => {
    expect(unverifiedRelatedPersonNames([kycError([])])).toEqual([]);
  });

  it('ignores other validation errors', () => {
    expect(
      unverifiedRelatedPersonNames([
        {
          code: 'COMPANY_STRUCTURE',
          message: 'Midagi muud',
          persons: [{ personalCode: '38001010000', name: 'Jaan Näidis' }],
        },
      ]),
    ).toEqual([]);
  });

  it('finds nobody when there are no errors at all', () => {
    expect(unverifiedRelatedPersonNames([])).toEqual([]);
  });
});
