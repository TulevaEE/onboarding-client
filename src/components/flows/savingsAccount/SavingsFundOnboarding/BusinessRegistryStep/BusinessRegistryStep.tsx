import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Control, Controller } from 'react-hook-form';
import { CompanyOnboardingFormData } from '../types';
import { SelectOption, SelectWithAutocomplete } from '../../../../common/SelectWithAutocomplete';
import { BusinessRegistrySearchResult } from '../types.api';

type BusinessRegistryStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

type BusinessRegistryOption = SelectOption & {
  reg_code: string;
  name: string;
};

export const BusinessRegistryStep = ({ control }: BusinessRegistryStepProps) => {
  const intl = useIntl();

  const fetchSuggestions = useMemo(
    () => async (value: string) => {
      if (value.length <= 3) {
        return [];
      }

      const results = await fetch(
        `https://ariregister.rik.ee/est/api/autocomplete?q=${value}`,
      ).then((res) => res.json());

      const mappedData: BusinessRegistryOption[] = results.data.map(
        (company: BusinessRegistrySearchResult): BusinessRegistryOption => ({
          value: String(company.company_id),
          reg_code: company.reg_code,
          name: company.name,
          text: `${company.name} (${company.reg_code})`,
        }),
      );

      return mappedData;
    },
    [],
  );

  return (
    <section className="d-flex flex-column gap-4" key="businessRegistry">
      <div className="section-header d-flex flex-column gap-1" id="section01-header">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.businessRegistryStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.businessRegistryStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="registryLookup"
          rules={{
            validate: (value) =>
              Boolean(value) ||
              intl.formatMessage({
                id: 'flows.savingsFundOnboarding.businessRegistryStep.input.required',
              }),
          }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <SelectWithAutocomplete<BusinessRegistryOption>
                className="mb-2 form-select form-select-lg"
                lookup={fetchSuggestions}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
              {error && error.message ? (
                <p className="m-0 text-danger fs-base" role="alert">
                  {error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      </div>
    </section>
  );
};
