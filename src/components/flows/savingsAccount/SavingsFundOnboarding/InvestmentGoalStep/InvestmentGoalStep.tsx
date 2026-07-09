import { useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldPath, FieldValues, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { InvestmentGoalsValue } from '../types';
import { InvestmentGoalOption } from '../types.api';
import { TranslationKey } from '../../../../translations';
import Radio from '../../../../common/radio';

type InvestmentGoalStepProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  options: { value: InvestmentGoalOption; labelId: TranslationKey }[];
  titleId: TranslationKey;
  descriptionId?: TranslationKey;
};

const optionRadioId = (value: InvestmentGoalOption) =>
  `investment-goal-${value.toLowerCase().replace(/_/g, '-')}`;

const generateRadioOptions = (
  fieldName: string,
  fieldValue: InvestmentGoalsValue | null | undefined,
  onChange: (value: { type: 'OPTION'; value: string }) => void,
  setIsOtherSelected: (value: boolean) => void,
  options: { value: InvestmentGoalOption; labelId: TranslationKey }[],
) =>
  options.map(({ value, labelId }) => {
    const id = optionRadioId(value);
    return (
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
    );
  });

export const InvestmentGoalStep = <T extends FieldValues>({
  control,
  name,
  options,
  titleId,
  descriptionId,
}: InvestmentGoalStepProps<T>) => {
  const intl = useIntl();
  const { field: investmentGoalsField } = useController({
    control,
    name,
  });
  const fieldValue = investmentGoalsField.value as InvestmentGoalsValue | null | undefined;
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
          <FormattedMessage id={titleId} />
        </h2>
        {descriptionId ? (
          <p className="m-0">
            <FormattedMessage id={descriptionId} />
          </p>
        ) : null}
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={name}
          rules={{
            validate: (raw) => {
              const value = raw as InvestmentGoalsValue | null | undefined;
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
            const value = field.value as InvestmentGoalsValue | null | undefined;
            return (
              <div className="selection-group d-flex flex-column gap-2">
                {generateRadioOptions(
                  field.name,
                  value,
                  field.onChange,
                  setIsOtherSelected,
                  options,
                )}
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
