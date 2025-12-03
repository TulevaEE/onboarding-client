import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../types';
import { Radio } from '../../../../common';

type InvestableAssetsStepProps = {
  control: Control<OnboardingFormData>;
};

const generateRadioOptions = (
  fieldName: string,
  fieldValue: string | null,
  onChange: (value: string) => void,
) =>
  [
    {
      id: 'assets-up-to-20k',
      value: 'LESS_THAN_20K',
      labelId: 'flows.savingsFundOnboarding.investableAssetsStep.upTo20k' as const,
    },
    {
      id: 'assets-20k-to-40k',
      value: 'RANGE_20K_40K',
      labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from20kTo40k' as const,
    },
    {
      id: 'assets-40k-to-80k',
      value: 'RANGE_40K_80K',
      labelId: 'flows.savingsFundOnboarding.investableAssetsStep.from40kTo80k' as const,
    },
    {
      id: 'assets-over-80k',
      value: 'MORE_THAN_80K',
      labelId: 'flows.savingsFundOnboarding.investableAssetsStep.over80k' as const,
    },
  ].map(({ id, value, labelId }) => (
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
  ));

export const InvestableAssetsStep: FC<InvestableAssetsStepProps> = ({ control }) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="investment-assets">
      <div className="section-header d-flex flex-column gap-1">
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
          name="investableAssets"
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
              {generateRadioOptions(field.name, field.value, field.onChange)}
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
