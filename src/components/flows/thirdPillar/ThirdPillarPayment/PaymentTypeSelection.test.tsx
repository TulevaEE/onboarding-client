import { screen, within } from '@testing-library/react';
import { PaymentTypeSelection } from './PaymentTypeSelection';
import { renderWrapped } from '../../../../test/utils';

describe('PaymentTypeSelection', () => {
  test('recommends the recurring payment and explains why', () => {
    renderWrapped(<PaymentTypeSelection paymentType="SINGLE" setPaymentType={jest.fn()} />);

    const paymentTypes = screen.getByRole('radiogroup', {
      name: /^What\sis\sthe\stype\sof\spayment\?$/,
    });
    expect(
      within(paymentTypes).getByRole('radio', { name: /^Single\spayment$/ }),
    ).toBeInTheDocument();
    expect(
      within(paymentTypes).getByRole('radio', {
        name: /^Recurring\spayment.*Recommended.*You\ssave\sautomatically,\swithout\shaving\sto\sthink\sabout\sit\.$/,
      }),
    ).toBeInTheDocument();
  });
});
