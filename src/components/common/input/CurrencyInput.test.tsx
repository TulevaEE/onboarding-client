import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CurrencyInput } from './CurrencyInput';

function TestWrapper({ initialValue, max }: { initialValue?: number; max?: number }) {
  const [value, setValue] = useState<number | undefined>(initialValue);
  return (
    <>
      <CurrencyInput value={value} onChange={setValue} max={max} id="test-input" />
      <span data-testid="output">{value}</span>
    </>
  );
}

function getInput(): HTMLInputElement {
  return screen.getByRole('textbox');
}

function getOutputValue(): string {
  return screen.getByTestId('output').textContent ?? '';
}

describe('CurrencyInput', () => {
  describe('typing amounts', () => {
    it('can type a whole number', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '20000');

      expect(input.value).toBe('20000');
      expect(getOutputValue()).toBe('20000');
    });

    it('can type a decimal amount', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '123.45');

      expect(input.value).toBe('123.45');
      expect(getOutputValue()).toBe('123.45');
    });

    it('can type a single digit decimal', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '123.4');

      expect(input.value).toBe('123.4');
      expect(getOutputValue()).toBe('123.4');
    });

    it('replaces comma with period', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '123,45');

      expect(input.value).toBe('123.45');
      expect(getOutputValue()).toBe('123.45');
    });

    it('can type zero', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '0');

      expect(input.value).toBe('0');
      expect(getOutputValue()).toBe('0');
    });

    it('can type amount starting with zero', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '0.50');

      expect(input.value).toBe('0.50');
      expect(getOutputValue()).toBe('0.5');
    });
  });

  describe('deleting with backspace', () => {
    it('can delete a number character by character', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '123,45');
      expect(input.value).toBe('123.45');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('123.4');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('123.');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('123');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('12');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('1');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('');
      expect(getOutputValue()).toBe('');
    });

    it('preserves trailing decimal point when backspacing', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '1.1');
      expect(input.value).toBe('1.1');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('1.');
    });

    it('can delete zero', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '0');
      expect(input.value).toBe('0');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('');
      expect(getOutputValue()).toBe('');
    });

    it('can continue typing after backspace to decimal', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '1.1');
      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('1.');

      userEvent.type(input, '5');
      expect(input.value).toBe('1.5');
      expect(getOutputValue()).toBe('1.5');
    });
  });

  describe('input validation', () => {
    it('rejects letters', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '12abc34');

      expect(input.value).toBe('1234');
    });

    it('rejects special characters', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '12!@#34');

      expect(input.value).toBe('1234');
    });

    it('rejects multiple decimal points', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '12.34.56');

      expect(input.value).toBe('12.34');
    });

    it('limits to 2 decimal places', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '12.345');

      expect(input.value).toBe('12.34');
    });

    it('rejects negative numbers', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '-123');

      expect(input.value).toBe('123');
    });
  });

  describe('max value', () => {
    it('caps value at max', () => {
      render(<TestWrapper max={100} />);
      const input = getInput();

      userEvent.type(input, '150');

      expect(input.value).toBe('100.00');
      expect(getOutputValue()).toBe('100');
    });

    it('allows values below max', () => {
      render(<TestWrapper max={100} />);
      const input = getInput();

      userEvent.type(input, '50');

      expect(input.value).toBe('50');
      expect(getOutputValue()).toBe('50');
    });

    it('allows exactly max value', () => {
      render(<TestWrapper max={100} />);
      const input = getInput();

      userEvent.type(input, '100');

      expect(input.value).toBe('100');
      expect(getOutputValue()).toBe('100');
    });
  });

  describe('initial value', () => {
    it('displays initial value', () => {
      render(<TestWrapper initialValue={123.45} />);
      const input = getInput();

      expect(input.value).toBe('123.45');
    });

    it('can modify initial value', () => {
      render(<TestWrapper initialValue={100} />);
      const input = getInput();

      userEvent.clear(input);
      userEvent.type(input, '200');

      expect(input.value).toBe('200');
      expect(getOutputValue()).toBe('200');
    });
  });

  describe('clearing input', () => {
    it('sets value to undefined when cleared', () => {
      render(<TestWrapper initialValue={100} />);
      const input = getInput();

      userEvent.clear(input);

      expect(input.value).toBe('');
      expect(getOutputValue()).toBe('');
    });
  });

  describe('euro symbol', () => {
    it('displays euro symbol', () => {
      render(<TestWrapper />);
      expect(screen.getByText('€')).toBeInTheDocument();
    });
  });

  describe('placeholder', () => {
    it('shows default placeholder', () => {
      render(<CurrencyInput value={undefined} onChange={() => {}} />);
      const input = getInput();
      expect(input.placeholder).toBe('0');
    });

    it('shows custom placeholder', () => {
      render(<CurrencyInput value={undefined} onChange={() => {}} placeholder="Enter amount" />);
      const input = getInput();
      expect(input.placeholder).toBe('Enter amount');
    });
  });

  describe('error state', () => {
    it('applies error styling when error prop is true', () => {
      render(<CurrencyInput value={undefined} onChange={() => {}} error />);
      const input = getInput();
      expect(input).toHaveClass('border-danger');
    });

    it('does not apply error styling when error prop is false', () => {
      render(<CurrencyInput value={undefined} onChange={() => {}} error={false} />);
      const input = getInput();
      expect(input).not.toHaveClass('border-danger');
    });
  });

  describe('two-way sync edge cases', () => {
    it('preserves trailing zero after decimal', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '1.10');

      expect(input.value).toBe('1.10');
      expect(getOutputValue()).toBe('1.1');
    });

    it('preserves trailing zeros in cents', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '5.00');

      expect(input.value).toBe('5.00');
      expect(getOutputValue()).toBe('5');
    });

    it('preserves zero with trailing decimal', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '0.');

      expect(input.value).toBe('0.');
    });

    it('preserves comma-entered trailing zero', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '1,10');

      expect(input.value).toBe('1.10');
      expect(getOutputValue()).toBe('1.1');
    });

    it('can backspace trailing zero without losing decimal', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '1.10');
      userEvent.type(input, '{backspace}');

      expect(input.value).toBe('1.1');

      userEvent.type(input, '{backspace}');
      expect(input.value).toBe('1.');
    });

    it('handles external value change from parent', async () => {
      function ControlledWrapper() {
        const [value, setValue] = useState<number | undefined>(100);
        return (
          <>
            <CurrencyInput value={value} onChange={setValue} id="test-input" />
            <button type="button" onClick={() => setValue(200)}>
              Set 200
            </button>
            <span data-testid="output">{value}</span>
          </>
        );
      }

      render(<ControlledWrapper />);
      const input = getInput();

      await waitFor(() => expect(input.value).toBe('100'));

      userEvent.click(screen.getByRole('button', { name: 'Set 200' }));

      await waitFor(() => expect(input.value).toBe('200'));
      expect(getOutputValue()).toBe('200');
    });

    it('handles external value change to undefined', async () => {
      function ControlledWrapper() {
        const [value, setValue] = useState<number | undefined>(100);
        return (
          <>
            <CurrencyInput value={value} onChange={setValue} id="test-input" />
            <button type="button" onClick={() => setValue(undefined)}>
              Clear
            </button>
            <span data-testid="output">{value}</span>
          </>
        );
      }

      render(<ControlledWrapper />);
      const input = getInput();

      await waitFor(() => expect(input.value).toBe('100'));

      userEvent.click(screen.getByRole('button', { name: 'Clear' }));

      await waitFor(() => expect(input.value).toBe(''));
      expect(getOutputValue()).toBe('');
    });

    it('does not lose user input when parent re-renders with same value', () => {
      function RerenderWrapper() {
        const [value, setValue] = useState<number | undefined>(undefined);
        const [, forceRerender] = useState(0);
        return (
          <>
            <CurrencyInput value={value} onChange={setValue} id="test-input" />
            <button type="button" onClick={() => forceRerender((n) => n + 1)}>
              Rerender
            </button>
            <span data-testid="output">{value}</span>
          </>
        );
      }

      render(<RerenderWrapper />);
      const input = getInput();

      userEvent.type(input, '1.');
      expect(input.value).toBe('1.');

      userEvent.click(screen.getByRole('button', { name: 'Rerender' }));

      expect(input.value).toBe('1.');
    });

    it('handles rapid typing without losing characters', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '12345.67');

      expect(input.value).toBe('12345.67');
      expect(getOutputValue()).toBe('12345.67');
    });

    it('handles typing after clearing with backspace', () => {
      render(<TestWrapper />);
      const input = getInput();

      userEvent.type(input, '123');
      userEvent.type(input, '{backspace}{backspace}{backspace}');
      expect(input.value).toBe('');

      userEvent.type(input, '456');
      expect(input.value).toBe('456');
      expect(getOutputValue()).toBe('456');
    });
  });
});
