import React, { FC } from 'react';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../../../translations';

export type Option = BaseOption & TranslateOption;

type BaseOption = {
  value: string;
  disabled?: boolean;
  divider?: boolean;
};

type TranslateOption =
  | {
      translate?: false;
      label: string;
    }
  | {
      translate: true;
      label: TranslationKey;
    };

export type OptionGroup = {
  options: Option[];
} & TranslateOption;

interface SelectProps {
  options: (Option | OptionGroup)[];
  selected: string;
  onChange: (selected: string) => void;
  disabled?: boolean;
  translate?: boolean;
  id?: string;
}

export const Select: FC<SelectProps> = ({
  options,
  selected,
  onChange,
  disabled = false,
  translate = true,
  id,
}) => {
  const { formatMessage } = useIntl();

  const getLabel = (option: Option | OptionGroup) => {
    if (translate && option.translate) {
      return formatMessage({ id: option.label });
    }

    return option.label;
  };

  const renderOption = (option: Option) => {
    if (option.divider) {
      return <hr />;
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
      id={id}
    >
      {renderOptions()}
    </select>
  );
};

export default Select;
