import { FC, useMemo } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../types';
import { EstonianAddressForm } from './EstonianAddressForm';
import Select from '../../../../account/ComparisonCalculator/select';
import { mapCountriesToGroupedOptions } from '../../../../common/countries';
import { AddressForm } from './AddressForm';

type ResidencyStepProps = {
  control: Control<OnboardingFormData>;
};

export const ResidencyStep: FC<ResidencyStepProps> = ({ control }) => {
  const intl = useIntl();
  const countryCode = useWatch({ control, name: 'address.countryCode' });
  const isEstonianResidence = countryCode === 'EE';

  const countryOptions = useMemo(() => mapCountriesToGroupedOptions(intl), [intl]);

  return (
    <section className="d-flex flex-column gap-4" key="residence">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <div>
          <Controller
            control={control}
            name="address.countryCode"
            render={({ field }) => (
              <>
                <label htmlFor={field.name} className="form-label">
                  <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.country.label" />
                </label>
                <Select
                  className="form-select-lg"
                  options={countryOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  name={field.name}
                  id={field.name}
                  translate={false}
                />
              </>
            )}
          />
        </div>
        {isEstonianResidence ? (
          <EstonianAddressForm control={control} />
        ) : (
          <AddressForm control={control} />
        )}
      </div>
    </section>
  );
};
