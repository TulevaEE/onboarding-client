import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { PlannedContributionOption } from '../types.api';
import { TranslationKey } from '../../../../translations';
import { Radio } from '../../../../common';

type PlannedContributionStepProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
};

const OPTIONS: { value: PlannedContributionOption; labelId: TranslationKey }[] = [
  { value: 'UP_TO_200', labelId: 'flows.savingsFundChildOnboarding.contributionStep.upTo200' },
  {
    value: 'FROM_200_TO_600',
    labelId: 'flows.savingsFundChildOnboarding.contributionStep.from200To600',
  },
  {
    value: 'FROM_600_TO_1000',
    labelId: 'flows.savingsFundChildOnboarding.contributionStep.from600To1000',
  },
  { value: 'OVER_1000', labelId: 'flows.savingsFundChildOnboarding.contributionStep.over1000' },
];

const optionRadioId = (value: PlannedContributionOption) =>
  `planned-contribution-${value.toLowerCase().replace(/_/g, '-')}`;

export const PlannedContributionStep = <T extends FieldValues>({
  control,
  name,
}: PlannedContributionStepProps<T>) => {
  const intl = useIntl();
  return (
    <section className="d-flex flex-column gap-4" key="planned-contribution">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.contributionStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.contributionStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={name}
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                id: 'flows.savingsFundChildOnboarding.contributionStep.required',
              }),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="selection-group d-flex flex-column gap-2">
              {OPTIONS.map(({ value, labelId }) => {
                const id = optionRadioId(value);
                return (
                  <Radio
                    key={id}
                    name={field.name}
                    id={id}
                    selected={field.value === value}
                    onSelect={() => field.onChange(value)}
                    className="p-3"
                  >
                    <label className="form-check-label fs-3 lh-sm me-2" htmlFor={id}>
                      <FormattedMessage id={labelId} />
                    </label>
                  </Radio>
                );
              })}
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
