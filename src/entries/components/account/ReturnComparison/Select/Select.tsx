import React, { FC } from 'react';
import { withTranslations } from 'retranslate';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  selected: string;
  onChange: (...args: string[]) => void;
  translations: { translate: (label: string) => '' };
  disabled?: boolean;
}

export const Select: FC<SelectProps> = ({
  options,
  selected,
  onChange,
  translations: { translate },
  disabled = false,
}) => (
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

export default withTranslations(Select);
