import { FC } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useCompanyBusinessRegistryValidation } from '../../../../common/apiHooks';
import { CompanyOnboardingFormData } from '../types';

type RequirementsCheckStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

export const RequirementsCheckStep: FC<RequirementsCheckStepProps> = ({ control }) => {
  const registryCode = useWatch({ control, name: 'registryLookup.registryNumber' });
  const registryName = useWatch({ control, name: 'registryLookup.registryName' });
  const { data } = useCompanyBusinessRegistryValidation(registryCode);

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
          <div className="col-6 fw-bold">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.companyName" />
          </div>
          <div className="col-6">{registryName}</div>
        </div>
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="col-6 fw-bold">
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.registryCode" />
          </div>
          <div className="col-6">{registryCode}</div>
        </div>
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="col-6 fw-bold">
            {' '}
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.foundingDate" />
          </div>
          <div className="col-6">Value</div>
        </div>
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="col-6 fw-bold">
            {' '}
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.companyAddress" />
          </div>
          <div className="col-6">{data?.address.value}</div>
        </div>
        <div className="d-sm-flex gap-3 align-items-center">
          <div className="col-6 fw-bold">
            {' '}
            <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.label.activityArea" />
          </div>
          <div className="col-6">
            {data && `${data.businessActivity.value} (${data.naceCode.value})`}
          </div>
        </div>
        <div className="border-top border-gray-2" />
        <div className="d-flex">Element</div>
      </div>
    </section>
  );
};
