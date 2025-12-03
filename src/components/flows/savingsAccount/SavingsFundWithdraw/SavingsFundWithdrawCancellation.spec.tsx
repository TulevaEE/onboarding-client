import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import { applicationsBackend, useTestBackends } from '../../../../test/backend';
import { savingsFundWithdrawalApplication } from '../../../account/ApplicationSection/fixtures';

describe('SavingsFundWithdrawCancellation', () => {
  const server = setupServer();
  let history: History;

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
    applicationsBackend(server, [savingsFundWithdrawalApplication]);
    initApp();
    history.push('/savings-fund/withdraw/WITHDRAWAL987654/cancellation');
  });

  it('shows the cancellation confirmation page for valid withdrawal', async () => {
    expect(await screen.findByRole('heading', { name: 'Cancel withdrawal' })).toBeInTheDocument();

    expect(screen.getByText('500.50 €')).toBeInTheDocument();

    expect(screen.getByText('March 1, 2024')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows success message after successful cancellation', async () => {
    server.use(cancelWithdrawal.success());

    expect(await screen.findByRole('heading', { name: 'Cancel withdrawal' })).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.queryByText('Cancel withdrawal')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Withdrawal cancelled')).toBeInTheDocument();
    expect(screen.getByText('The withdrawal has been successfully cancelled.')).toBeInTheDocument();

    const myAccountButton = screen.getByRole('link', { name: 'My Account' });
    expect(myAccountButton).toHaveAttribute('href', '/account');
  });

  it('shows error message if cancellation fails', async () => {
    server.use(cancelWithdrawal.failure());

    expect(await screen.findByRole('heading', { name: 'Cancel withdrawal' })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'There was an error cancelling the withdrawal. Please try again later or contact us: tuleva@tuleva.ee',
        ),
      ).toBeInTheDocument();
    });
  });

  const cancelWithdrawal = {
    success: () =>
      rest.delete('http://localhost/v1/savings/redemptions/WITHDRAWAL987654', (req, res, ctx) =>
        res(ctx.status(204)),
      ),
    failure: () =>
      rest.delete('http://localhost/v1/savings/redemptions/WITHDRAWAL987654', (req, res, ctx) =>
        res(ctx.status(500)),
      ),
  };
});
