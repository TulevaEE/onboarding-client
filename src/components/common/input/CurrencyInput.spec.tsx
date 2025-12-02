import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWrapped } from '../../../test/utils';
import { CurrencyInput } from './CurrencyInput';

const CurrencyInputWrapper = ({
  initialValue,
  max,
  error = false,
  placeholder,
}: {
  initialValue?: number;
  max?: number;
  error?: boolean;
  placeholder?: string;
}) => {
  const [value, setValue] = useState<number | undefined>(initialValue);

  return (
    <CurrencyInput
      id="test-input"
      value={value}
      onChange={setValue}
      error={error}
      max={max}
      placeholder={placeholder}
    />
  );
};

describe('CurrencyInput', () => {
  it('renders with euro symbol', () => {
    renderWrapped(<CurrencyInputWrapper />);

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    renderWrapped(<CurrencyInputWrapper placeholder="100" />);

    const input = screen.getByPlaceholderText('100');
    expect(input).toBeInTheDocument();
  });

  it('accepts decimal input with period', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '123.45');

    expect(input).toHaveValue('123.45');
  });

  it('accepts comma as decimal separator and normalizes to period', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '123,45');

    expect(input).toHaveValue('123.45');
  });

  it('limits decimal places to two digits', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '123.456');

    expect(input).toHaveValue('123.45');
  });

  it('rejects non-numeric input', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, 'abc');

    expect(input).toHaveValue('');
  });

  it('rejects multiple decimal separators', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '12.34.56');

    expect(input).toHaveValue('12.34');
  });

  it('enforces maximum value when provided', async () => {
    renderWrapped(<CurrencyInputWrapper max={100} />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '150');

    await waitFor(() => {
      expect(input).toHaveValue('100');
    });
  });

  it('allows values below maximum', async () => {
    renderWrapped(<CurrencyInputWrapper max={100} />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '50.25');

    expect(input).toHaveValue('50.25');
  });

  it('allows clearing the input', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '123.45');
    expect(input).toHaveValue('123.45');

    userEvent.clear(input);
    expect(input).toHaveValue('');
  });

  it('accepts whole numbers without decimal separator', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '100');

    expect(input).toHaveValue('100');
  });

  it('accepts values with single decimal digit', async () => {
    renderWrapped(<CurrencyInputWrapper />);

    const input = screen.getByDisplayValue('');
    userEvent.type(input, '123.4');

    expect(input).toHaveValue('123.4');
  });

  it('displays initial value when provided', () => {
    renderWrapped(<CurrencyInputWrapper initialValue={50.5} />);

    const input = screen.getByDisplayValue('50.5');
    expect(input).toBeInTheDocument();
  });

  it('clears value when undefined is passed', async () => {
    const TestComponent = () => {
      const [value, setValue] = useState<number | undefined>(100);

      return (
        <>
          <CurrencyInput id="test-input" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(undefined)}>
            Clear
          </button>
        </>
      );
    };

    renderWrapped(<TestComponent />);

    expect(screen.getByDisplayValue('100')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  it('applies error styling when error prop is true', () => {
    renderWrapped(<CurrencyInputWrapper error />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveClass('border-danger');
    expect(input).toHaveClass('focus-ring-danger');
  });

  it('does not apply error styling when error prop is false', () => {
    renderWrapped(<CurrencyInputWrapper error={false} />);

    const input = screen.getByDisplayValue('');
    expect(input).not.toHaveClass('border-danger');
    expect(input).not.toHaveClass('focus-ring-danger');
  });
});
