import { FC, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Control, Controller } from 'react-hook-form';
import { mapCountriesToGroupedOptions } from '../../../../common/countries';
import { MultiSelect, MultiSelectOptionGroup } from '../../../../common/MultiSelect/MultiSelect';
import { OnboardingFormData } from '../types';

type CitizenshipStepProps = {
  control: Control<OnboardingFormData>;
};

export const CitizenshipStep: FC<CitizenshipStepProps> = ({ control }) => {
  const intl = useIntl();

  const citizenshipOptions: MultiSelectOptionGroup[] = useMemo(
    () => mapCountriesToGroupedOptions(intl) satisfies MultiSelectOptionGroup[],
    [intl],
  );

  return (
    <section className="d-flex flex-column gap-4" key="citizenship">
      <div className="section-header d-flex flex-column gap-1" id="section01-header">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.citizenshipStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.citizenshipStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="citizenship"
          rules={{
            validate: (value) =>
              value.length > 0 ||
              intl.formatMessage({
                id: 'flows.savingsFundOnboarding.citizenshipStep.input.required',
              }),
          }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <MultiSelect
                className="mb-2 form-select form-select-lg"
                options={citizenshipOptions}
                selected={field.value}
                placeholder={intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.citizenshipStep.input.placeholder',
                })}
                deleteButtonTitle={intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.citizenshipStep.input.deleteButtonTitle',
                })}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ariaLabel={intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.citizenshipStep.input.ariaLabel',
                })}
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
