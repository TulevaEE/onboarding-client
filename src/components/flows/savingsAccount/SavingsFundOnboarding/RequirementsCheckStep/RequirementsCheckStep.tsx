import './RequirementsCheckStep.scss';
import { FC, useEffect } from 'react';
import { Control, useController, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useCompanyBusinessRegistryValidation } from '../../../../common/apiHooks';
import { formatDateYear } from '../../../../common/dateFormatter';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { CompanyOnboardingFormData } from '../types';
import { errorCode, errorMessage } from './collectValidationErrors';
import { hasNoValidationErrors } from './hasNoValidationErrors';

// Identity-verification codes the backend sets on the relatedPersons field.
// USER_KYC: the logged-in user themselves is unverified (we can offer a direct CTA).
// OTHER_RELATED_PERSONS_KYC: someone else connected to the company is (offer a link).
const USER_KYC_CODE = 'USER_KYC';
const OTHER_RELATED_PERSONS_KYC_CODE = 'OTHER_RELATED_PERSONS_KYC';
const IDENTITY_KYC_CODES = [USER_KYC_CODE, OTHER_RELATED_PERSONS_KYC_CODE];

type RequirementsCheckStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

export const RequirementsCheckStep: FC<RequirementsCheckStepProps> = ({ control }) => {
  const registryCode = useWatch({ control, name: 'registryLookup.registryNumber' });
  const registryName = useWatch({ control, name: 'registryLookup.registryName' });
  const { data, isSuccess, isLoading, isError, error, refetch, isFetching } =
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

  // The backend marks unverified connected people with dedicated identity codes on
  // the relatedPersons field. USER_KYC means the logged-in user is one of them, so
  // we offer a direct CTA; OTHER_RELATED_PERSONS_KYC means someone else is, so we
  // offer a shareable link. It does not expose which specific person, so the copy
  // stays generic. Any other relatedPersons error (e.g. ownership structure) is a
  // genuine "company does not fit" reason and flows to the generic list below.
  const relatedPersonErrorCodes = (data?.relatedPersons.errors ?? []).map(errorCode);
  const userIdentityIncomplete = relatedPersonErrorCodes.includes(USER_KYC_CODE);
  const otherPersonsIdentityIncomplete = relatedPersonErrorCodes.includes(
    OTHER_RELATED_PERSONS_KYC_CODE,
  );
  const identityIncomplete =
    isSuccess && (userIdentityIncomplete || otherPersonsIdentityIncomplete);
  const identityVerificationUrl = `${window.location.origin}/savings-fund/onboarding`;

  // Every validation error except the identity-KYC ones (which have their own
  // dedicated dead-end block) — these are genuine "company does not fit" reasons.
  const otherRequirementErrors = data
    ? Object.values(data)
        .flatMap((validatedField) => validatedField.errors)
        .filter((validationError) => !IDENTITY_KYC_CODES.includes(errorCode(validationError)))
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
            {userIdentityIncomplete && (
              <a
                className="btn btn-primary"
                href={identityVerificationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.selfCta" />
              </a>
            )}
            {otherPersonsIdentityIncomplete && (
              <div className="d-flex flex-column gap-1">
                <span>
                  <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.shareInstruction" />
                </span>
                <a href={identityVerificationUrl} target="_blank" rel="noopener noreferrer">
                  {identityVerificationUrl}
                </a>
              </div>
            )}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.identityIncomplete.checkAgain" />
            </button>
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
