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
import { savingFundPaymentApplication } from '../../../account/ApplicationSection/fixtures';

describe('SavingsFundPaymentCancellation', () => {
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
    applicationsBackend(server, [savingFundPaymentApplication]);
    initApp();
    history.push('/savings-fund/payment/PAYMENT123456/cancellation');
  });

  it('shows the cancellation confirmation page for valid payment', async () => {
    expect(await screen.findByRole('heading', { name: 'Cancel deposit' })).toBeInTheDocument();

    // Check that the payment amount is displayed (in the format: "250.99 €")
    expect(screen.getByText('250.99 €')).toBeInTheDocument();

    // Check that the cancellation deadline is displayed (formatted as "February 15 at 23:59")
    expect(screen.getByText('February 15 at 23:59')).toBeInTheDocument();

    // Check that both buttons are present
    expect(screen.getByRole('link', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows success message after successful cancellation', async () => {
    server.use(cancelPayment.success());

    expect(await screen.findByRole('heading', { name: 'Cancel deposit' })).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    });

    // Wait for success state to appear
    await waitFor(() => {
      expect(screen.queryByText('Cancel deposit')).not.toBeInTheDocument();
    });

    // Check that success state is showing
    expect(screen.getByText('Deposit cancelled')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We will refund the money to the same bank account within one business day.',
      ),
    ).toBeInTheDocument();

    // Check the "My Account" button in the success alert
    const myAccountButton = screen.getByRole('link', { name: 'My Account' });
    expect(myAccountButton).toHaveAttribute('href', '/account');
  });

  it('shows error message if cancellation fails', async () => {
    server.use(cancelPayment.failure());

    expect(await screen.findByRole('heading', { name: 'Cancel deposit' })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(
          'There was an error cancelling the payment. Please try again later or contact us: tuleva@tuleva.ee',
        ),
      ).toBeInTheDocument();
    });
  });

  const cancelPayment = {
    success: () =>
      rest.delete('http://localhost/v1/savings/payments/PAYMENT123456', (req, res, ctx) =>
        res(ctx.status(204)),
      ),
    failure: () =>
      rest.delete('http://localhost/v1/savings/payments/PAYMENT123456', (req, res, ctx) =>
        res(ctx.status(500)),
      ),
  };
});
