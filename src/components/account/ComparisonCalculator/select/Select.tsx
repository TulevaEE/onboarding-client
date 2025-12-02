import { FC } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
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
  name?: string;
  id?: string;
  className?: string;
}

export const Select: FC<SelectProps> = ({
  options,
  selected,
  onChange,
  name,
  disabled = false,
  translate = true,
  id,
  className,
}) => {
  const { formatMessage } = useIntl();

  const getLabel = (option: Option | OptionGroup) => {
    if (translate && option.translate !== false) {
      return formatMessage({ id: option.label as TranslationKey });
    }

    return option.label;
  };

  const renderOption = (option: Option) => {
    if (option.divider) {
      return <hr key={`divider-${option.value}`} />;
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
      className={classNames('form-select', className)}
      onChange={(event): void => onChange(event.target.value)}
      value={selected}
      disabled={disabled}
      id={id}
      name={name}
    >
      {renderOptions()}
    </select>
  );
};

export default Select;
