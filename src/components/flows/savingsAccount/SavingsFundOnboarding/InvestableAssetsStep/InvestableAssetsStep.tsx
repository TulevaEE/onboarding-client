import { Control, Controller, Path } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { SharedOnboardingFields } from '../types';
import { InvestableAssetsOption } from '../types.api';
import { TranslationKey } from '../../../../translations';
import { Radio } from '../../../../common';

type InvestableAssetsStepProps<T extends SharedOnboardingFields = SharedOnboardingFields> = {
  control: Control<T>;
  options: { value: InvestableAssetsOption; labelId: TranslationKey }[];
};

const optionRadioId = (value: InvestableAssetsOption) =>
  `investable-assets-${value.toLowerCase().replace(/_/g, '-')}`;

const generateRadioOptions = (
  fieldName: string,
  fieldValue: string | null,
  onChange: (value: string) => void,
  options: { value: InvestableAssetsOption; labelId: TranslationKey }[],
) =>
  options.map(({ value, labelId }) => {
    const id = optionRadioId(value);
    return (
      <Radio
        key={id}
        name={fieldName}
        id={id}
        selected={fieldValue === value}
        onSelect={() => onChange(value)}
        className="p-3"
      >
        <label className="form-check-label fs-3 lh-sm me-2" htmlFor={id}>
          <FormattedMessage id={labelId} />
        </label>
      </Radio>
    );
  });

export const InvestableAssetsStep = <T extends SharedOnboardingFields = SharedOnboardingFields>({
  control,
  options,
}: InvestableAssetsStepProps<T>) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="investment-assets">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investableAssetsStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investableAssetsStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={'investableAssets' as Path<T>}
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                id: 'flows.savingsFundOnboarding.investableAssetsStep.required',
              }),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="selection-group d-flex flex-column gap-2">
              {generateRadioOptions(
                field.name,
                field.value as string | null,
                field.onChange,
                options,
              )}
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
