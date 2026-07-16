import { useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../../../../translations';
import Checkbox from '../../../../common/checkbox/Checkbox';

type OptionItem<T extends string> = { type: 'OPTION'; value: T };
type TextItem = { type: 'TEXT'; value: string };
export type MultiSelectValue<T extends string> = Array<OptionItem<T> | TextItem>;

type MultiSelectOptionsStepProps<F extends FieldValues, T extends string> = {
  control: Control<F>;
  name: FieldPath<F>;
  options: { id: string; value: T; labelId: TranslationKey }[];
  titleId: TranslationKey;
  descriptionId: TranslationKey;
  // Id of the "Other" checkbox; its label span gets `${otherId}-label` for aria-labelledby.
  otherId: string;
  messages: {
    other: TranslationKey;
    otherPlaceholder: TranslationKey;
    required: TranslationKey;
    otherRequired: TranslationKey;
  };
};

// A multi-select step: card checkboxes over a list of options plus a free-text "Other".
// The value is an array of {OPTION} / {TEXT} items. Shared by funding sources and the
// child's investment goals — anywhere the saver may legitimately pick more than one.
export const MultiSelectOptionsStep = <F extends FieldValues, T extends string>({
  control,
  name,
  options,
  titleId,
  descriptionId,
  otherId,
  messages,
}: MultiSelectOptionsStepProps<F, T>) => {
  const intl = useIntl();
  const otherLabelId = `${otherId}-label`;
  const raw = useWatch({ control, name });
  const selected: MultiSelectValue<T> = (raw ?? []) as MultiSelectValue<T>;
  const [isOtherSelected, setIsOtherSelected] = useState(
    selected.some((item) => item.type === 'TEXT'),
  );
  const [otherValue, setOtherValue] = useState(
    selected.find((item) => item.type === 'TEXT')?.value || '',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) {
      inputRef.current?.focus();
    }
  }, [isOtherSelected]);

  const optionItems = () =>
    selected.filter((item): item is OptionItem<T> => item.type === 'OPTION');

  const isChecked = (value: T) =>
    selected.some((item) => item.type === 'OPTION' && item.value === value);

  const handleToggle = (
    onChange: (value: MultiSelectValue<T>) => void,
    value: T,
    checked: boolean,
  ) => {
    const currentOptions = optionItems();
    const textItem = selected.find((item) => item.type === 'TEXT');
    const newOptions = checked
      ? [...currentOptions, { type: 'OPTION' as const, value }]
      : currentOptions.filter((item) => item.value !== value);
    onChange(textItem ? [...newOptions, textItem] : newOptions);
  };

  return (
    <section className="d-flex flex-column gap-4" key={otherId}>
      <div className="d-flex flex-column gap-1">
        <h2 className="m-0">
          <FormattedMessage id={titleId} />
        </h2>
        <p className="m-0">
          <FormattedMessage id={descriptionId} />
        </p>
      </div>
      <div className="section-content d-flex flex-column gap-4">
        <Controller
          control={control}
          name={name}
          rules={{
            validate: (rawValue) => {
              const value: MultiSelectValue<T> = (rawValue ?? []) as MultiSelectValue<T>;
              const hasOption = value.some((item) => item.type === 'OPTION');
              const textItem = value.find((item) => item.type === 'TEXT');
              const hasValidText = textItem && textItem.value.trim().length > 0;

              if (!hasOption && !textItem) {
                return intl.formatMessage({ id: messages.required });
              }
              if (textItem && !hasValidText) {
                return intl.formatMessage({ id: messages.otherRequired });
              }
              return true;
            },
          }}
          render={({ field, fieldState: { error } }) => {
            const onChange = field.onChange as (value: MultiSelectValue<T>) => void;
            return (
              <div className="selection-group d-flex flex-column gap-2">
                {options.map(({ id, value, labelId }) => (
                  <Checkbox
                    key={id}
                    id={id}
                    checked={isChecked(value)}
                    onToggle={(checked) => handleToggle(onChange, value, checked)}
                  >
                    <span className="fs-3 lh-sm">
                      <FormattedMessage id={labelId} />
                    </span>
                  </Checkbox>
                ))}
                <div className="d-flex flex-column gap-2">
                  <Checkbox
                    id={otherId}
                    checked={isOtherSelected}
                    onToggle={(checked) => {
                      setIsOtherSelected(checked);
                      if (checked) {
                        onChange([...optionItems(), { type: 'TEXT', value: otherValue }]);
                      } else {
                        setOtherValue('');
                        onChange(optionItems());
                      }
                    }}
                  >
                    <span className="fs-3 lh-sm" id={otherLabelId}>
                      <FormattedMessage id={messages.other} />
                    </span>
                  </Checkbox>
                  {isOtherSelected ? (
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-lg"
                      aria-labelledby={otherLabelId}
                      placeholder={intl.formatMessage({ id: messages.otherPlaceholder })}
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
