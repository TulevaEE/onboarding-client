import { useEffect, useState } from 'react';
import classNames from 'classnames';
import styles from './CurrencyInput.module.scss';

type CurrencyInputProps = {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: boolean;
  placeholder?: string;
  max?: number;
};

export function CurrencyInput({
  id,
  value,
  onChange,
  error,
  placeholder = '0',
  max,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (value == null || Number.isNaN(value)) {
      setInputValue('');
    } else {
      const currentNumericValue = Number(inputValue.replace(',', '.'));
      if (currentNumericValue !== value) {
        setInputValue(value.toString());
      }
    }
  }, [value, inputValue]);

  const handleChange = (raw: string) => {
    const euroRegex = /^\d+([.,]\d{0,2})?$/;

    if (raw === '') {
      setInputValue('');
      onChange(undefined);
      return;
    }

    if (!euroRegex.test(raw)) {
      return;
    }

    const normalized = raw.replace(',', '.');
    setInputValue(normalized);

    let num = Number(normalized);
    if (Number.isNaN(num)) {
      onChange(undefined);
      return;
    }
    if (max !== undefined && num > max) {
      num = Number(max.toFixed(2));
      setInputValue(num.toFixed(2));
    }
    onChange(num);
  };

  return (
    <div className={`input-group input-group-lg ${styles.inputGroup}`}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        inputMode="decimal"
        value={inputValue}
        placeholder={placeholder}
        className={classNames('form-control form-control-lg fw-semibold', {
          'border-danger focus-ring focus-ring-danger': error,
        })}
        onChange={(e) => handleChange(e.target.value)}
      />
      <span className="input-group-text fw-semibold">€</span>
    </div>
  );
}
