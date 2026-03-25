import { FormattedMessage, useIntl } from 'react-intl';
import { Control, Controller } from 'react-hook-form';
import { CompanyOnboardingFormData } from '../types';
import { SelectOption, SelectWithAutocomplete } from '../../../../common/SelectWithAutocomplete';
import { BusinessRegistrySearchResult } from '../types.api';

const BUSINESS_REGISTRY_API_URL = 'https://ariregister.rik.ee/est/api/autocomplete';

type BusinessRegistryStepProps = {
  control: Control<CompanyOnboardingFormData>;
};

type BusinessRegistryOption = SelectOption & {
  reg_code: string;
  name: string;
};

const fetchSuggestions = async (value: string) => {
  if (value.length <= 3) {
    return [];
  }

  const results = await fetch(`${BUSINESS_REGISTRY_API_URL}?q=${encodeURIComponent(value)}`).then(
    (res) => res.json(),
  );

  const mappedData: BusinessRegistryOption[] = results.data.map(
    (company: BusinessRegistrySearchResult): BusinessRegistryOption => ({
      value: company.reg_code,
      reg_code: company.reg_code,
      name: company.name,
      text: `${company.name} (${company.reg_code})`,
    }),
  );

  return mappedData;
};

export const BusinessRegistryStep = ({ control }: BusinessRegistryStepProps) => {
  const intl = useIntl();

  return (
    <section className="d-flex flex-column gap-4" key="businessRegistry">
      <div className="d-flex flex-column gap-1">
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
          render={({ field, fieldState: { error } }) => {
            const previousSelectionOption: BusinessRegistryOption[] = field.value
              ? [
                  {
                    value: field.value.registryNumber,
                    reg_code: field.value.registryNumber,
                    name: field.value.registryName,
                    text: `${field.value.registryName} (${field.value.registryNumber})`,
                  },
                ]
              : [];
            const previousSelectionValue = previousSelectionOption[0]?.value;

            return (
              <div>
                <SelectWithAutocomplete<BusinessRegistryOption>
                  className="mb-2 form-select form-select-lg"
                  lookup={fetchSuggestions}
                  options={previousSelectionOption}
                  defaultValue={previousSelectionValue}
                  onChange={(option) =>
                    field.onChange(
                      option
                        ? { registryNumber: option.reg_code, registryName: option.name }
                        : undefined,
                    )
                  }
                  onBlur={field.onBlur}
                  placeholder={intl.formatMessage({
                    id: 'flows.savingsFundOnboarding.businessRegistryStep.input.placeholder',
                  })}
                />
                {error && error.message ? (
                  <p className="m-0 text-danger fs-base" role="alert">
                    {error.message}
                  </p>
                ) : null}
              </div>
            );
          }}
        />
      </div>
    </section>
  );
};
