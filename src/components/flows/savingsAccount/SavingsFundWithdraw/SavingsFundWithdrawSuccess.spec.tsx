import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { SavingsFundWithdrawSuccess } from './SavingsFundWithdrawSuccess';
import { createDefaultStore, renderWrapped } from '../../../../test/utils';

describe('SavingsFundWithdrawSuccess', () => {
  it('displays success message with link to account page', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    renderWrapped(<SavingsFundWithdrawSuccess />, history as any, store);

    expect(screen.getByRole('heading', { name: 'Withdrawal successful' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The withdrawal will be processed within three business days. The exact amount will be determined by the sale of units and depends on the market price of the units.',
      ),
    ).toBeInTheDocument();

    const accountLink = screen.getByRole('link', { name: 'My Account' });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute('href', '/account');
  });
});
