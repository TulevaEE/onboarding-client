import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { errorCode } from './collectValidationErrors';

const OTHER_RELATED_PERSONS_KYC_CODE = 'OTHER_RELATED_PERSONS_KYC';

type RelatedPerson = { name: string; personalCode: string };

// The wire format carries no per-person KYC status, so the only place the client
// learns who is still unverified is the tail the backend appends to this error's
// message ("<sentence>: Name, Name", or a personal code where it had no name).
// Everything read out of that prose is kept only if it is already on the page as
// a related person, and an empty result falls back to addressing everyone.
export const unverifiedRelatedPersonNames = (
  errors: ValidationError[],
  relatedPersons: RelatedPerson[],
): string[] => {
  const message =
    errors.find((error) => errorCode(error) === OTHER_RELATED_PERSONS_KYC_CODE)?.message ?? '';
  const separator = message.indexOf(':');
  if (separator < 0) {
    return [];
  }

  const listed = new Set(
    relatedPersons.flatMap((person) => [person.name, person.personalCode]).filter(Boolean),
  );

  return message
    .slice(separator + 1)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => listed.has(entry));
};
