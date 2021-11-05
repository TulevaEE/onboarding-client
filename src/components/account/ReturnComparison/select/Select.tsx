import React, { FC } from 'react';
import { useTranslations } from 'retranslate';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  selected: string;
  onChange: (selected: string) => void;
  disabled?: boolean;
}

export const Select: FC<SelectProps> = ({ options, selected, onChange, disabled = false }) => {
  const { translate } = useTranslations();

  return (
    <select
      className="custom-select"
      onChange={(event): void => onChange(event.target.value)}
      value={selected}
      disabled={disabled}
    >
      {options.map(({ value, label }) => (
        <option value={value} key={label}>
          {translate(label)}
        </option>
      ))}
    </select>
  );
};

export default Select;
