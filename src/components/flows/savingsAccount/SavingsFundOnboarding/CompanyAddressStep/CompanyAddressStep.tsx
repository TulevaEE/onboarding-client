import { FC } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { CompanyOnboardingFormData } from '../types';
import { Radio } from '../../../../common';

type CompanyAddressStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

export const CompanyAddressStep: FC<CompanyAddressStepProps> = ({ control }) => {
  const companyValidatedData = useWatch({ control, name: 'companyValidatedData' });

  return (
    <section className="d-flex flex-column gap-4">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.companyAddressStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="companyAddress"
          render={({ field }) => (
            <div className="selection-group d-flex flex-column gap-2">
              <Radio
                name={field.name}
                id="company-address-reuse"
                selected={field.value.reuseBackendAddress === true}
                onSelect={() => field.onChange({ reuseBackendAddress: true })}
                className="p-3"
              >
                <label
                  className="form-check-label fs-3 lh-sm me-2 d-flex flex-column"
                  htmlFor="company-address-reuse"
                >
                  <FormattedMessage id="flows.savingsFundOnboarding.companyAddressStep.reUseAddress" />
                  <div className="fs-xs">{companyValidatedData?.address.value.fullAddress}</div>
                </label>
              </Radio>
            </div>
          )}
        />
      </div>
      <p className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.companyAddressStep.description" />
      </p>
    </section>
  );
};
