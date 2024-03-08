import React, { FC } from 'react';
import { useIntl } from 'react-intl';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
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

  return (
    <select
      className="custom-select"
      onChange={(event): void => onChange(event.target.value)}
      value={selected}
      disabled={disabled}
    >
      {options.map(({ value, label }) => (
        <option value={value} key={label}>
          {getLabel(label)}
        </option>
      ))}
    </select>
  );
};

export default Select;
