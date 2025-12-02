import classNames from 'classnames';
import { ReactNode } from 'react';
import { Control, Controller, FieldError, FieldValues, Path } from 'react-hook-form';
import styles from './AmountInput.module.scss';

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

  const handleAmountChange = (value: string, onChange: (value: string) => void) => {
    const euroRegex = /^\d+([.,]\d{0,2})?$/;

    if (value === '' || euroRegex.test(value)) {
      const normalizedValue = value.replace(',', '.');

      if (max !== undefined && normalizedValue !== '') {
        const numericValue = Number(normalizedValue);
        if (!Number.isNaN(numericValue) && numericValue > max) {
          onChange(max.toFixed(2));
          return;
        }
      }
      onChange(normalizedValue);
    }
  };

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
            validate: {
              validateNumber: (value) => !Number.isNaN(Number(String(value).replace(',', '.'))),
            },
          }}
          render={({ field, fieldState: { error: fieldError } }) => (
            <>
              <div className={`input-group input-group-lg ${styles.inputGroup}`}>
                <input
                  autoComplete="off"
                  type="text"
                  id={inputId}
                  placeholder="0"
                  inputMode="decimal"
                  className={classNames(`form-control form-control-lg fw-semibold`, {
                    'border-danger focus-ring focus-ring-danger': !!fieldError,
                  })}
                  {...field}
                  onChange={(e) => handleAmountChange(e.target.value, field.onChange)}
                />
                <span className="input-group-text fw-semibold">&euro;</span>
              </div>
            </>
          )}
        />
      </div>
      {error ? <div className="d-block invalid-feedback">{error.message}</div> : null}
      {description && <p className="m-0 text-secondary">{description}</p>}
    </div>
  );
}
