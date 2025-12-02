import { FC, useEffect, useRef, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { SourceOfIncomeOption } from '../types.api';
import { OnboardingFormData } from '../types';

type IncomeSourcesStepProps = {
  control: Control<OnboardingFormData>;
};

const generateCheckboxOptions = (
  isChecked: (option: SourceOfIncomeOption) => boolean,
  handleCheckboxChange: (
    fieldOnChange: (value: OnboardingFormData['sourceOfIncome']) => void,
    option: SourceOfIncomeOption,
    checked: boolean,
  ) => void,
  fieldOnChange: (value: OnboardingFormData['sourceOfIncome']) => void,
) =>
  [
    {
      id: 'income-salary',
      value: 'SALARY' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.salary' as const,
    },
    {
      id: 'income-savings',
      value: 'SAVINGS' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.savings' as const,
    },
    {
      id: 'income-investments',
      value: 'INVESTMENTS' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.investments' as const,
    },
    {
      id: 'income-pension',
      value: 'PENSION_OR_BENEFITS' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.pension' as const,
    },
    {
      id: 'income-family',
      value: 'FAMILY_FUNDS_OR_INHERITANCE' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.family' as const,
    },
    {
      id: 'income-business',
      value: 'BUSINESS_INCOME' as const,
      labelId: 'flows.savingsFundOnboarding.incomeSourcesStep.business' as const,
    },
  ].map(({ id, value, labelId }) => (
    <div key={id} className="form-check m-0 lead">
      <input
        className="form-check-input"
        type="checkbox"
        id={id}
        checked={isChecked(value)}
        onChange={(e) => handleCheckboxChange(fieldOnChange, value, e.target.checked)}
      />
      <label className="form-check-label" htmlFor={id}>
        <FormattedMessage id={labelId} />
      </label>
    </div>
  ));

export const IncomeSourcesStep: FC<IncomeSourcesStepProps> = ({ control }) => {
  const intl = useIntl();
  const sourceOfIncome = useWatch({ control, name: 'sourceOfIncome' });
  const [isOtherSelected, setIsOtherSelected] = useState(
    sourceOfIncome.some((item) => item.type === 'TEXT'),
  );
  const [otherValue, setOtherValue] = useState(
    sourceOfIncome.find((item) => item.type === 'TEXT')?.value || '',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) {
      inputRef.current?.focus();
    }
  }, [isOtherSelected]);

  const handleCheckboxChange = (
    fieldOnChange: (value: OnboardingFormData['sourceOfIncome']) => void,
    option: SourceOfIncomeOption,
    checked: boolean,
  ) => {
    const currentOptions = sourceOfIncome.filter((item) => item.type === 'OPTION') as Array<{
      type: 'OPTION';
      value: SourceOfIncomeOption;
    }>;
    const currentTextItem = sourceOfIncome.find((item) => item.type === 'TEXT');

    if (checked) {
      const newOptions = [...currentOptions, { type: 'OPTION' as const, value: option }];
      fieldOnChange(currentTextItem ? [...newOptions, currentTextItem] : newOptions);
    } else {
      const newOptions = currentOptions.filter((item) => item.value !== option);
      fieldOnChange(currentTextItem ? [...newOptions, currentTextItem] : newOptions);
    }
  };

  const isChecked = (option: SourceOfIncomeOption) =>
    sourceOfIncome.some((item) => item.type === 'OPTION' && item.value === option);

  return (
    <section className="d-flex flex-column gap-4" key="income-sources">
      <div className="section-header d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.incomeSourcesStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.incomeSourcesStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name="sourceOfIncome"
          render={({ field }) => (
            <div className="selection-group d-flex flex-column gap-2">
              {generateCheckboxOptions(isChecked, handleCheckboxChange, field.onChange)}
              <div className="form-check m-0 lead">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="income-other"
                  checked={isOtherSelected}
                  onChange={(event) => {
                    const { checked } = event.target;
                    setIsOtherSelected(checked);
                    if (checked) {
                      const currentOptions = sourceOfIncome.filter(
                        (item) => item.type === 'OPTION',
                      );
                      field.onChange([...currentOptions, { type: 'TEXT', value: otherValue }]);
                    } else {
                      setOtherValue('');
                      field.onChange(sourceOfIncome.filter((item) => item.type !== 'TEXT'));
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="income-other" id="income-other-label">
                  <FormattedMessage id="flows.savingsFundOnboarding.incomeSourcesStep.other" />
                </label>
                {isOtherSelected ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control form-control-lg mt-2"
                    aria-labelledby="income-other-label"
                    placeholder={intl.formatMessage({
                      id: 'flows.savingsFundOnboarding.incomeSourcesStep.otherPlaceholder',
                    })}
                    value={otherValue}
                    onChange={(e) => {
                      setOtherValue(e.target.value);
                      const currentOptions = sourceOfIncome.filter(
                        (item) => item.type === 'OPTION',
                      );
                      field.onChange([...currentOptions, { type: 'TEXT', value: e.target.value }]);
                    }}
                  />
                ) : null}
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
};
