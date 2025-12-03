import { FC, useEffect, useRef, useState } from 'react';
import { Control, Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { OnboardingFormData } from '../types';
import Radio from '../../../../common/radio';

type InvestmentGoalStepProps = {
  control: Control<OnboardingFormData>;
};

const generateRadioOptions = (
  fieldName: string,
  fieldValue: OnboardingFormData['investmentGoals'],
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

export const InvestmentGoalStep: FC<InvestmentGoalStepProps> = ({ control }) => {
  const intl = useIntl();
  const { field: investmentGoalsField } = useController({ control, name: 'investmentGoals' });
  const [isOtherSelected, setIsOtherSelected] = useState(
    investmentGoalsField.value?.type === 'TEXT',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) {
      inputRef.current?.focus();

      if (investmentGoalsField.value && investmentGoalsField.value.type === 'OPTION') {
        investmentGoalsField.onChange({ type: 'TEXT', value: '' });
      }
    }
  }, [isOtherSelected]);

  return (
    <section className="d-flex flex-column gap-4" key="investment-goal">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.investmentGoalStep.title" />
        </h2>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="investmentGoals"
          rules={{
            validate: (value) => {
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
          render={({ field, fieldState: { error } }) => (
            <div className="selection-group d-flex flex-column gap-2">
              {generateRadioOptions(field.name, field.value, field.onChange, setIsOtherSelected)}
              <Radio
                name={field.name}
                id="investment-goal-other"
                selected={isOtherSelected}
                onSelect={() => {
                  setIsOtherSelected(true);
                }}
                className="p-3"
              >
                <label className="form-check-label fs-3 lh-sm me-2" htmlFor="investment-goal-other">
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
                  value={field.value?.type === 'TEXT' ? field.value.value : ''}
                  onChange={(e) => field.onChange({ type: 'TEXT', value: e.target.value })}
                />
              ) : null}
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
