import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { errorCode } from './collectValidationErrors';

const OTHER_RELATED_PERSONS_KYC_CODE = 'OTHER_RELATED_PERSONS_KYC';

// The backend names who is still unverified in the error's `persons`, omitting the
// field when it knows nobody — then the caller falls back to addressing everyone.
export const unverifiedRelatedPersonNames = (errors: ValidationError[]): string[] =>
  (errors.find((error) => errorCode(error) === OTHER_RELATED_PERSONS_KYC_CODE)?.persons ?? []).map(
    (person) => person.name || person.personalCode,
  );
