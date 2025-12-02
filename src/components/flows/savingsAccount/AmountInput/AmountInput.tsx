import { ReactNode } from 'react';
import { Control, Controller, FieldError, FieldValues, Path } from 'react-hook-form';
import { CurrencyInput } from '../../../common/input/CurrencyInput';

type AmountInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  error?: FieldError;
  label: ReactNode;
  description?: ReactNode;
  errorMessage: string;
  max?: number;
};

export function AmountInput<T extends FieldValues>({
  control,
  name,
  error,
  label,
  description,
  errorMessage,
  max,
}: AmountInputProps<T>) {
  const inputId = `${name}-input`;

  return (
    <div className="form-section d-flex flex-column gap-3">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
        <label htmlFor={inputId} className="fs-3 fw-semibold">
          {label}
        </label>
        <Controller
          control={control}
          name={name}
          rules={{
            required: {
              value: true,
              message: errorMessage,
            },
            min: {
              value: 1,
              message: errorMessage,
            },
          }}
          render={({ field, fieldState }) => (
            <CurrencyInput
              id={inputId}
              value={field.value}
              onChange={field.onChange}
              error={!!fieldState.error}
              max={max}
            />
          )}
        />
      </div>
      {error ? <div className="d-block invalid-feedback">{error.message}</div> : null}
      {description && <p className="m-0 text-secondary">{description}</p>}
    </div>
  );
}
