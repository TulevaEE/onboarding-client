import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { OnboardingFormData } from '../types';
import { Radio } from '../../../../common';

type PepStepProps = {
  control: Control<OnboardingFormData>;
};

const generateRadioOptions = (
  fieldName: string,
  fieldValue: string | null,
  onChange: (value: string) => void,
) =>
  [
    {
      id: 'pep-yes',
      value: 'IS_PEP',
      labelId: 'flows.savingsFundOnboarding.pepStep.yes' as const,
    },
    {
      id: 'pep-no',
      value: 'IS_NOT_PEP',
      labelId: 'flows.savingsFundOnboarding.pepStep.no' as const,
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

export const PepStep: FC<PepStepProps> = ({ control }) => (
  <section className="d-flex flex-column gap-4" key="politically-exposed">
    <div className="section-header d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.pepStep.title" />
      </h2>
      <p className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.pepStep.description" />
      </p>
    </div>
    <div className="section-content d-flex flex-column gap-4">
      <Controller
        control={control}
        name="pepSelfDeclaration"
        render={({ field }) => (
          <div className="selection-group d-flex flex-column gap-2">
            {generateRadioOptions(field.name, field.value, field.onChange)}
          </div>
        )}
      />
    </div>
  </section>
);
