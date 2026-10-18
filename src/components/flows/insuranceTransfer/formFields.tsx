import { ReactNode, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form';
import classNames from 'classnames';
import Select from '../../account/ComparisonCalculator/select';
import { countries, mapCountriesToGroupedOptions } from '../../common/countries';
import { TranslationKey } from '../../translations';

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
};

const describedBy = (id: string, hint: ReactNode, error: string | undefined) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

const HintAndError = ({ id, hint, error }: Pick<FieldProps, 'id' | 'hint' | 'error'>) => (
  <>
    {hint && (
      <div id={`${id}-hint`} className="form-text text-pretty">
        {hint}
      </div>
    )}
    {error && (
      <div id={`${id}-error`} className="invalid-feedback">
        {error}
      </div>
    )}
  </>
);

export const TextField = ({
  id,
  label,
  error,
  hint,
  className,
  registration,
  type = 'text',
  inputClassName,
  autoComplete,
  autoCapitalize,
  maxLength,
}: FieldProps & {
  registration: UseFormRegisterReturn;
  type?: 'text' | 'date';
  inputClassName?: string;
  autoComplete?: string;
  autoCapitalize?: 'characters';
  maxLength?: number;
}) => (
  <div className={className}>
    <label className="form-label" htmlFor={id}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      className={classNames('form-control', inputClassName, { 'is-invalid': error })}
      aria-invalid={!!error}
      aria-describedby={describedBy(id, hint, error)}
      autoComplete={autoComplete}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      spellCheck={false}
      {...registration}
    />
    <HintAndError id={id} hint={hint} error={error} />
  </div>
);

export const ChoiceField = <TChoice extends string>({
  id,
  label,
  error,
  className,
  registration,
  choices,
  choiceMessageId,
}: FieldProps & {
  registration: UseFormRegisterReturn;
  choices: readonly TChoice[];
  choiceMessageId: (choice: TChoice) => TranslationKey;
}) => {
  const { formatMessage } = useIntl();
  return (
    <div className={className}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={classNames('form-select', { 'is-invalid': error })}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, null, error)}
        {...registration}
      >
        <option value="">{formatMessage({ id: 'insuranceTransfer.form.choose' })}</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {formatMessage({ id: choiceMessageId(choice) })}
          </option>
        ))}
      </select>
      <HintAndError id={id} error={error} />
    </div>
  );
};

export const CountryField = <TValues extends FieldValues>({
  id,
  label,
  className,
  control,
  name,
  shownWhenUnset = '',
}: Omit<FieldProps, 'error' | 'hint'> & {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  shownWhenUnset?: string;
}) => {
  const intl = useIntl();
  const options = useMemo(() => mapCountriesToGroupedOptions(intl), [intl]);
  return (
    <div className={className}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            options={options}
            selected={field.value || shownWhenUnset}
            onChange={field.onChange}
            id={id}
            name={field.name}
            selectRef={field.ref}
            translate={false}
          />
        )}
      />
    </div>
  );
};

export const useCountryName = () => {
  const { formatMessage } = useIntl();
  return (code: string) => {
    const country = countries.find(({ iso2Code }) => iso2Code === code);
    return country ? formatMessage({ id: country.translationKey as TranslationKey }) : code;
  };
};
