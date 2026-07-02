import { useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { FundingSourceOption, FundingSourcesSurveyItem } from '../types.api';
import { TranslationKey } from '../../../../translations';

type FundingSourcesValue = FundingSourcesSurveyItem['value'];

type FundingSourcesStepProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
};

const OPTIONS: { id: string; value: FundingSourceOption; labelId: TranslationKey }[] = [
  {
    id: 'funding-parent-income',
    value: 'PARENT_INCOME_AND_SAVINGS',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.parentIncome',
  },
  {
    id: 'funding-gifts',
    value: 'GIFTS',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.gifts',
  },
  {
    id: 'funding-inheritance',
    value: 'INHERITANCE',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.inheritance',
  },
  {
    id: 'funding-child-own',
    value: 'CHILD_OWN',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.childOwn',
  },
];

export const FundingSourcesStep = <T extends FieldValues>({
  control,
  name,
}: FundingSourcesStepProps<T>) => {
  const intl = useIntl();
  const rawFundingSources = useWatch({ control, name });
  const fundingSources: FundingSourcesValue = (rawFundingSources ?? []) as FundingSourcesValue;
  const [isOtherSelected, setIsOtherSelected] = useState(
    fundingSources.some((item) => item.type === 'TEXT'),
  );
  const [otherValue, setOtherValue] = useState(
    fundingSources.find((item) => item.type === 'TEXT')?.value || '',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) {
      inputRef.current?.focus();
    }
  }, [isOtherSelected]);

  const optionItems = () =>
    fundingSources.filter((item) => item.type === 'OPTION') as Array<{
      type: 'OPTION';
      value: FundingSourceOption;
    }>;

  const handleCheckboxChange = (
    fieldOnChange: (value: FundingSourcesValue) => void,
    option: FundingSourceOption,
    checked: boolean,
  ) => {
    const currentOptions = optionItems();
    const currentTextItem = fundingSources.find((item) => item.type === 'TEXT');
    const newOptions = checked
      ? [...currentOptions, { type: 'OPTION' as const, value: option }]
      : currentOptions.filter((item) => item.value !== option);
    fieldOnChange(currentTextItem ? [...newOptions, currentTextItem] : newOptions);
  };

  const isChecked = (option: FundingSourceOption) =>
    fundingSources.some((item) => item.type === 'OPTION' && item.value === option);

  return (
    <section className="d-flex flex-column gap-4" key="funding-sources">
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.fundingSourcesStep.title" />
        </h2>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundChildOnboarding.fundingSourcesStep.description" />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={name}
          rules={{
            validate: (raw) => {
              const value: FundingSourcesValue = (raw ?? []) as FundingSourcesValue;
              const hasOption = value.some((item) => item.type === 'OPTION');
              const textItem = value.find((item) => item.type === 'TEXT');
              const hasValidText = textItem && textItem.value.trim().length > 0;

              if (!hasOption && !textItem) {
                return intl.formatMessage({
                  id: 'flows.savingsFundChildOnboarding.fundingSourcesStep.required',
                });
              }
              if (textItem && !hasValidText) {
                return intl.formatMessage({
                  id: 'flows.savingsFundChildOnboarding.fundingSourcesStep.other.required',
                });
              }
              return true;
            },
          }}
          render={({ field, fieldState: { error } }) => {
            const onChange = field.onChange as (value: FundingSourcesValue) => void;
            return (
              <div className="selection-group d-flex flex-column gap-2">
                {OPTIONS.map(({ id, value, labelId }) => (
                  <div key={id} className="form-check m-0 lead">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={id}
                      checked={isChecked(value)}
                      onChange={(e) => handleCheckboxChange(onChange, value, e.target.checked)}
                    />
                    <label className="form-check-label w-100" htmlFor={id}>
                      <FormattedMessage id={labelId} />
                    </label>
                  </div>
                ))}
                <div className="form-check m-0 lead">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="funding-other"
                    checked={isOtherSelected}
                    onChange={(event) => {
                      const { checked } = event.target;
                      setIsOtherSelected(checked);
                      if (checked) {
                        onChange([...optionItems(), { type: 'TEXT', value: otherValue }]);
                      } else {
                        setOtherValue('');
                        onChange(optionItems());
                      }
                    }}
                  />
                  <label
                    className="form-check-label w-100"
                    htmlFor="funding-other"
                    id="funding-other-label"
                  >
                    <FormattedMessage id="flows.savingsFundChildOnboarding.fundingSourcesStep.other" />
                  </label>
                  {isOtherSelected ? (
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-lg mt-2"
                      aria-labelledby="funding-other-label"
                      placeholder={intl.formatMessage({
                        id: 'flows.savingsFundChildOnboarding.fundingSourcesStep.otherPlaceholder',
                      })}
                      value={otherValue}
                      onChange={(e) => {
                        setOtherValue(e.target.value);
                        onChange([...optionItems(), { type: 'TEXT', value: e.target.value }]);
                      }}
                    />
                  ) : null}
                </div>
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
