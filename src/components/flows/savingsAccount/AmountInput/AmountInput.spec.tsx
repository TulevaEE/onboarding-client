import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { renderWrapped } from '../../../../test/utils';
import { AmountInput } from './AmountInput';

const AmountInputWrapper = ({
  max,
  errorMessage = 'Amount is required',
}: {
  max?: number;
  errorMessage?: string;
}) => {
  const { control, formState } = useForm({
    mode: 'onChange',
    defaultValues: { amount: '' },
  });

  return (
    <form>
      <AmountInput
        control={control}
        name="amount"
        label="Amount"
        description="Enter the amount in euros"
        errorMessage={errorMessage}
        error={formState.errors.amount}
        max={max}
      />
    </form>
  );
};

describe('AmountInput', () => {
  it('renders with label and description', () => {
    renderWrapped(<AmountInputWrapper />);

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Enter the amount in euros')).toBeInTheDocument();
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('accepts decimal input with period', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '123.45');

    expect(input).toHaveValue('123.45');
  });

  it('accepts comma as decimal separator and normalizes to period', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '123,45');

    expect(input).toHaveValue('123.45');
  });

  it('limits decimal places to two digits', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '123.456');

    expect(input).toHaveValue('123.45');
  });

  it('rejects non-numeric input', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, 'abc');

    expect(input).toHaveValue('');
  });

  it('rejects multiple decimal separators', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '12.34.56');

    expect(input).toHaveValue('12.34');
  });

  it('enforces maximum value when provided', async () => {
    renderWrapped(<AmountInputWrapper max={100} />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '150');

    await waitFor(() => {
      expect(input).toHaveValue('100.00');
    });
  });

  it('allows values below maximum', async () => {
    renderWrapped(<AmountInputWrapper max={100} />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '50.25');

    expect(input).toHaveValue('50.25');
  });

  it('allows clearing the input', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '123.45');
    expect(input).toHaveValue('123.45');

    userEvent.clear(input);
    expect(input).toHaveValue('');
  });

  it('accepts whole numbers without decimal separator', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '100');

    expect(input).toHaveValue('100');
  });

  it('accepts values with single decimal digit', async () => {
    renderWrapped(<AmountInputWrapper />);

    const input = screen.getByLabelText('Amount');
    userEvent.type(input, '123.4');

    expect(input).toHaveValue('123.4');
  });
});
