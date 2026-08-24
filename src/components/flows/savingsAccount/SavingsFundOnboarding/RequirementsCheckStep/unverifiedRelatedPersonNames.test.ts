import { unverifiedRelatedPersonNames } from './unverifiedRelatedPersonNames';

const person = (name: string, personalCode: string) => ({ name, personalCode });
const kycError = (message: string) => ({ code: 'OTHER_RELATED_PERSONS_KYC', message });

describe('unverifiedRelatedPersonNames', () => {
  it('reads the names the backend appended to the message', () => {
    expect(
      unverifiedRelatedPersonNames(
        [kycError('Isikusamasuse tuvastamine on lõpetamata: Jaan Näidis')],
        [person('Mari Näidis', '48001010000'), person('Jaan Näidis', '38001010000')],
      ),
    ).toEqual(['Jaan Näidis']);
  });

  it('reads several names', () => {
    expect(
      unverifiedRelatedPersonNames(
        [kycError('Isikusamasuse tuvastamine on lõpetamata: Jaan Näidis, Mari Näidis')],
        [person('Mari Näidis', '48001010000'), person('Jaan Näidis', '38001010000')],
      ),
    ).toEqual(['Jaan Näidis', 'Mari Näidis']);
  });

  it('finds nothing when the backend appended no names', () => {
    expect(
      unverifiedRelatedPersonNames(
        [kycError('Isikusamasuse tuvastamine on lõpetamata')],
        [person('Mari Näidis', '48001010000')],
      ),
    ).toEqual([]);
  });

  // The message is prose, so anything not already shown on the page is treated as
  // noise rather than rendered as if it were a person.
  it('ignores anything that is not a person listed on the page', () => {
    expect(
      unverifiedRelatedPersonNames(
        [kycError('Isikusamasuse tuvastamine on lõpetamata: Keegi Tundmatu')],
        [person('Mari Näidis', '48001010000')],
      ),
    ).toEqual([]);
  });

  it('falls back to the personal code when the backend had no name for someone', () => {
    expect(
      unverifiedRelatedPersonNames(
        [kycError('Isikusamasuse tuvastamine on lõpetamata: 38001010000')],
        [person('Mari Näidis', '48001010000'), person('', '38001010000')],
      ),
    ).toEqual(['38001010000']);
  });

  it('ignores other validation errors', () => {
    expect(
      unverifiedRelatedPersonNames(
        [{ code: 'COMPANY_STRUCTURE', message: 'Midagi muud: Jaan Näidis' }],
        [person('Jaan Näidis', '38001010000')],
      ),
    ).toEqual([]);
  });

  it('survives a message that is only a colon', () => {
    expect(
      unverifiedRelatedPersonNames([kycError('Lõpetamata:')], [person('Mari', '48001010000')]),
    ).toEqual([]);
  });
});
