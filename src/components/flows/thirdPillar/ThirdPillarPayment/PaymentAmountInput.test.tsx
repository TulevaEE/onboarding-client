import React, { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentAmountInput } from './PaymentAmountInput';
import { renderWrapped } from '../../../../test/utils';

describe('PaymentAmountInput Component', () => {
  const ControlledComponent = ({
    max,
    paymentType,
  }: {
    max?: number;
    paymentType?: 'SINGLE' | 'RECURRING';
  }) => {
    const [inputValue, setInputValue] = useState('');

    return (
      <PaymentAmountInput
        paymentType={paymentType || 'SINGLE'}
        max={max}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    );
  };

  it('shows a warning message when input exceeds max limit', () => {
    renderWrapped(<ControlledComponent max={6000} />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, '7001');

    expect(screen.getByRole('alert')).toHaveTextContent(/not more than 6000 €/i);
  });

  it('shows a warning message when input exceeds max limit for recurring payments', () => {
    renderWrapped(<ControlledComponent max={6000} paymentType="RECURRING" />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, '501');

    expect(screen.getByRole('alert')).toHaveTextContent(/not more than 6000 €/i);
  });

  it('removes warning message when value is corrected within the limit', () => {
    renderWrapped(<ControlledComponent max={6000} />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, '7001');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    userEvent.clear(input);
    userEvent.type(input, '5000');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not display warning when max is not provided', () => {
    renderWrapped(<ControlledComponent />);
    const input = screen.getByRole('textbox');

    userEvent.type(input, '8000');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the correct placeholder based on payment type', () => {
    renderWrapped(<PaymentAmountInput paymentType="SINGLE" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('1000')).toBeInTheDocument();

    renderWrapped(<PaymentAmountInput paymentType="RECURRING" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('100')).toBeInTheDocument();
  });
});
