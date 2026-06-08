import './RequirementsCheckStep.scss';
import { FC, useEffect } from 'react';
import { Control, useController, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useCompanyBusinessRegistryValidation, useMe } from '../../../../common/apiHooks';
import { formatDateYear } from '../../../../common/dateFormatter';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { CompanyOnboardingFormData } from '../types';
import { errorMessage } from './collectValidationErrors';
import { hasNoValidationErrors } from './hasNoValidationErrors';

type RequirementsCheckStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

export const RequirementsCheckStep: FC<RequirementsCheckStepProps> = ({ control }) => {
  const registryCode = useWatch({ control, name: 'registryLookup.registryNumber' });
  const registryName = useWatch({ control, name: 'registryLookup.registryName' });
  const { data, isSuccess, isLoading, isError, error } =
    useCompanyBusinessRegistryValidation(registryCode);
  const isNotBoardMember =
    isError && (error as { body?: { error?: string } })?.body?.error === 'NOT_BOARD_MEMBER';
  const isUnexpectedError =
    isError && (error as { body?: { error?: string } })?.body?.error === 'UNEXPECTED_ERROR';
  const { field } = useController({
    control,
    name: 'companyValidatedData',
    rules: {
      validate: (companyData) => {
        if (isLoading) {
          return 'Loading';
        }
        if (!companyData) {
          return 'No data';
        }

        return hasNoValidationErrors(companyData) || 'Validation failed';
      },
    },
  });

  useEffect(() => {
    if (!isSuccess || !data) {
      return;
    }

    field.onChange(data);
  }, [isSuccess, data]);

  const history = useHistory();
  const { data: user } = useMe();

  // The backend flags incomplete identity verification as an error on the
  // relatedPersons field. It does not tell us which related person is unverified
  // (only that some are), so we degrade to a generic call to action plus a
  // shareable link, and offer a direct CTA only when the logged-in user is one
  // of the connected people and can act on it themselves.
  const identityIncomplete = isSuccess && !!data && data.relatedPersons.errors.length > 0;
  const currentUserIsRelatedPerson =
    !!data &&
    data.relatedPersons.value.some((person) => person.personalCode === user?.personalCode);
  const identityVerificationUrl = `${window.location.origin}/savings-fund/onboarding`;

  // Errors on every field except relatedPersons (which has its own dedicated
  // identity dead-end block) — these are genuine "company does not fit" reasons.
  const otherRequirementErrors = data
    ? Object.entries(data)
        .filter(([fieldName]) => fieldName !== 'relatedPersons')
        .flatMap(([, validatedField]) => validatedField.errors)
        .map(errorMessage)
    : [];

  return (
    <section className="d-flex flex-column gap-5 bg-light border border-gray-2 rounded rounded-4 p-4">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.description" />
        </p>
      </div>
      <div className="d-flex flex-column gap-3">
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="half-column fw-bold">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.companyName" />
          </div>
          <div className="half-column">{registryName}</div>
        </div>
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="half-column fw-bold">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.registryCode" />
          </div>
          <div className="half-column">{registryCode}</div>
        </div>
        {!isError && (
          <>
            <div className="d-sm-flex gap-3 align-items-center">
              <div className="half-column fw-bold">
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.foundingDate" />
              </div>
              <div className="half-column">
                {isSuccess && data ? formatDateYear(data.foundingDate.value) : <Shimmer />}
              </div>
            </div>
            <div className="d-sm-flex gap-3 align-items-center">
              <div className="half-column fw-bold">
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.companyAddress" />
              </div>
              <div className="half-column">
                {isSuccess && data ? data.address.value.fullAddress : <Shimmer />}
              </div>
            </div>
            <div className="d-sm-flex gap-3 align-items-center">
              <div className="half-column fw-bold">
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.activityArea" />
              </div>
              <div className="half-column">
                {isSuccess && data ? (
                  `${data.businessActivity.value} (${data.naceCode.value})`
                ) : (
                  <Shimmer />
                )}
              </div>
            </div>
            <div className="border-top border-gray-2" />
            <div className="d-flex flex-column d-sm-grid flex-wrap gap-3 half-column-grid">
              {isSuccess && data ? (
                data.relatedPersons.value.map((person) => (
                  <div key={person.personalCode} className="d-flex flex-column gap-1">
                    <div className="fw-bold">
                      <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.relatedPerson" />
                    </div>
                    <div>
                      <div className="fs-3">{person.name}</div>
                      <div>{person.personalCode}</div>
                    </div>
                  </div>
                ))
              ) : (
                <Shimmer />
              )}
            </div>
          </>
        )}
        {otherRequirementErrors.length > 0 && (
          <div className="alert alert-danger m-0" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.error.notFitting" />
            <ul className="m-0">
              {otherRequirementErrors.map((validationError) => (
                <li key={validationError}>{validationError}</li>
              ))}
            </ul>
          </div>
        )}
        {identityIncomplete && (
          <div
            className="alert alert-warning m-0 d-flex flex-column gap-3 align-items-start"
            role="alert"
          >
            <div className="d-flex flex-column gap-1">
              <strong>
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.title" />
              </strong>
              <span>
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.description" />
              </span>
            </div>
            {currentUserIsRelatedPerson && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => history.push('/savings-fund/onboarding')}
              >
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.selfCta" />
              </button>
            )}
            <div className="d-flex flex-column gap-1">
              <span>
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.shareInstruction" />
              </span>
              <a href={identityVerificationUrl}>{identityVerificationUrl}</a>
            </div>
          </div>
        )}
        {isNotBoardMember && (
          <div className="alert alert-danger m-0" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.error.notBoardMember" />
          </div>
        )}
        {isUnexpectedError && (
          <div className="alert alert-danger m-0" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.error.unexpectedError" />
          </div>
        )}
      </div>
    </section>
  );
};
