import React, { FC } from 'react';
import { useIntl } from 'react-intl';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface OptionGroup {
  label: string;
  options: Option[];
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

  const getLabel = (label: string) => {
    return translate ? formatMessage({ id: label }) : label;
  };

  const renderOption = (option: Option) => (
    <option value={option.value} key={option.value} disabled={option.disabled}>
      {getLabel(option.label)}
    </option>
  );

  const renderOptions = () =>
    options.map((option) =>
      'options' in option ? (
        <optgroup label={getLabel(option.label)} key={option.label}>
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
