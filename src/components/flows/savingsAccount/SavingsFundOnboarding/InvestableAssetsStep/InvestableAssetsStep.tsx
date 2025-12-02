import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
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

export const InvestableAssetsStep: FC<InvestableAssetsStepProps> = ({ control }) => (
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
        render={({ field }) => (
          <div className="selection-group d-flex flex-column gap-2">
            {generateRadioOptions(field.name, field.value, field.onChange)}
          </div>
        )}
      />
    </div>
  </section>
);
