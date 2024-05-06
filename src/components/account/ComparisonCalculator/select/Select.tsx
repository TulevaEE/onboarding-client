import React, { FC } from 'react';
import { useIntl } from 'react-intl';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  divider?: boolean;
  translate?: boolean;
}

export interface OptionGroup {
  label: string;
  options: Option[];
  translate?: boolean;
}

interface SelectProps {
  options: (Option | OptionGroup)[];
  selected: string;
  onChange: (selected: string) => void;
  disabled?: boolean;
  translate?: boolean;
}

export const Select: FC<SelectProps> = ({
  options,
  selected,
  onChange,
  disabled = false,
  translate = true,
}) => {
  const { formatMessage } = useIntl();

  const getLabel = (option: Option | OptionGroup) => {
    return translate && option.translate !== false
      ? formatMessage({ id: option.label })
      : option.label;
  };

  const renderOption = (option: Option) => {
    if (option.divider) {
      return (
        <option value={option.value} key={option.value} disabled>
          ─────────────────────────
        </option>
      );
    }
    return (
      <option value={option.value} key={option.value} disabled={option.disabled}>
        {getLabel(option)}
      </option>
    );
  };

  const renderOptions = () =>
    options.map((option) =>
      'options' in option ? (
        <optgroup label={getLabel(option)} key={option.label}>
          {option.options.map(renderOption)}
        </optgroup>
      ) : (
        renderOption(option)
      ),
    );

  return (
    <select
      className="custom-select"
      onChange={(event): void => onChange(event.target.value)}
      value={selected}
      disabled={disabled}
    >
      {renderOptions()}
    </select>
  );
};

export default Select;
