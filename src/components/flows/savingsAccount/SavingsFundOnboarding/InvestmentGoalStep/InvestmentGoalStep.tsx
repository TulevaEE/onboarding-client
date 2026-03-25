import { useEffect, useRef, useState } from 'react';
import { Control, Controller, Path, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { SharedOnboardingFields } from '../types';
import Radio from '../../../../common/radio';

type InvestmentGoalStepProps<T extends SharedOnboardingFields = SharedOnboardingFields> = {
  control: Control<T>;
};

const generateRadioOptions = (
  fieldName: string,
  fieldValue: SharedOnboardingFields['investmentGoals'],
  onChange: (value: { type: 'OPTION'; value: string }) => void,
  setIsOtherSelected: (value: boolean) => void,
) =>
  [
    {
      id: 'investment-goal-long-term',
      value: 'LONG_TERM',
      labelId: 'flows.savingsFundOnboarding.investmentGoalStep.longTerm' as const,
    },
    {
      id: 'investment-goal-specific',
      value: 'SPECIFIC_GOAL',
      labelId: 'flows.savingsFundOnboarding.investmentGoalStep.specificGoal' as const,
    },
    {
      id: 'investment-goal-child',
      value: 'CHILD',
      labelId: 'flows.savingsFundOnboarding.investmentGoalStep.childFuture' as const,
    },
    {
      id: 'investment-goal-active',
      value: 'TRADING',
      labelId: 'flows.savingsFundOnboarding.investmentGoalStep.activeTrading' as const,
    },
  ].map(({ id, value, labelId }) => (
    <Radio
      key={id}
      name={fieldName}
      id={id}
      selected={fieldValue?.type === 'OPTION' && fieldValue.value === value}
      onSelect={() => {
        setIsOtherSelected(false);
        onChange({ type: 'OPTION', value });
      }}
      className="p-3"
    >
      <label className="form-check-label fs-3 lh-sm me-2" htmlFor={id}>
        <FormattedMessage id={labelId} />
      </label>
    </Radio>
  ));

export const InvestmentGoalStep = <T extends SharedOnboardingFields = SharedOnboardingFields>({
  control,
}: InvestmentGoalStepProps<T>) => {
  const intl = useIntl();
  const { field: investmentGoalsField } = useController({
    control,
    name: 'investmentGoals' as Path<T>,
  });
  const fieldValue = investmentGoalsField.value as SharedOnboardingFields['investmentGoals'];
  const [isOtherSelected, setIsOtherSelected] = useState(fieldValue?.type === 'TEXT');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) {
      inputRef.current?.focus();

      if (fieldValue && fieldValue.type === 'OPTION') {
        investmentGoalsField.onChange({ type: 'TEXT', value: '' });
      }
    }
  }, [isOtherSelected]);

  return (
    <section className="d-flex flex-column gap-4" key="investment-goal">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investmentGoalStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={'investmentGoals' as Path<T>}
          rules={{
            validate: (raw) => {
              const value = raw as SharedOnboardingFields['investmentGoals'];
              if (!value) {
                return intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.investmentGoalStep.required',
                });
              }
              if (value.type === 'TEXT' && value.value.length === 0) {
                return intl.formatMessage({
                  id: 'flows.savingsFundOnboarding.investmentGoalStep.other.required',
                });
              }
              return true;
            },
          }}
          render={({ field, fieldState: { error } }) => {
            const value = field.value as SharedOnboardingFields['investmentGoals'];
            return (
              <div className="selection-group d-flex flex-column gap-2">
                {generateRadioOptions(field.name, value, field.onChange, setIsOtherSelected)}
                <Radio
                  name={field.name}
                  id="investment-goal-other"
                  selected={isOtherSelected}
                  onSelect={() => {
                    setIsOtherSelected(true);
                  }}
                  className="p-3"
                >
                  <label
                    className="form-check-label fs-3 lh-sm me-2"
                    htmlFor="investment-goal-other"
                  >
                    <FormattedMessage id="flows.savingsFundOnboarding.investmentGoalStep.other" />
                  </label>
                </Radio>
                {isOtherSelected ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control form-control-lg mt-2"
                    aria-labelledby="investment-goal-other"
                    placeholder={intl.formatMessage({
                      id: 'flows.savingsFundOnboarding.investmentGoalStep.otherPlaceholder',
                    })}
                    value={value?.type === 'TEXT' ? value.value : ''}
                    onChange={(e) => field.onChange({ type: 'TEXT', value: e.target.value })}
                  />
                ) : null}
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
