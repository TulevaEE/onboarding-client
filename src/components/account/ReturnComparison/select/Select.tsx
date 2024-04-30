import React, { FC } from 'react';
import { useIntl } from 'react-intl';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
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
      {/* eslint-disable-next-line @typescript-eslint/no-shadow */}
      {options.map(({ value, label, disabled }) => (
        <option value={value} key={label} disabled={disabled}>
          {getLabel(label)}
        </option>
      ))}
    </select>
  );
};

export default Select;
