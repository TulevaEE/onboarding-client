import './RequirementsCheckStep.scss';
import { FC, useEffect } from 'react';
import { Control, useController, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useCompanyBusinessRegistryValidation } from '../../../../common/apiHooks';
import { formatDateYear } from '../../../../common/dateFormatter';
import { Shimmer } from '../../../../common/shimmer/Shimmer';
import { CompanyOnboardingFormData } from '../types';
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
          <div className="d-sm-flex gap-3 align-items-center">
            <div className="half-column fw-bold">
              <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.foundingDate" />
            </div>
            <div className="half-column">
              {isSuccess && data ? formatDateYear(data.foundingDate.value) : <Shimmer />}
            </div>
          </div>
        )}
        {!isError && (
          <div className="d-sm-flex gap-3 align-items-center">
            <div className="half-column fw-bold">
              <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.companyAddress" />
            </div>
            <div className="half-column">
              {isSuccess && data ? data.address.value.fullAddress : <Shimmer />}
            </div>
          </div>
        )}
        {!isError && (
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
        )}
        {isNotBoardMember && (
          <div className="alert alert-danger m-0" role="alert">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.error.notBoardMember" />
          </div>
        )}
      </div>
    </section>
  );
};
