import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import {
  savingsFundAccountClosureBackend,
  savingsFundOnboardingStatusBackend,
  useTestBackends,
} from '../../../../test/backend';

describe('SavingsFundAccountClosure', () => {
  const server = setupServer();
  let history: History;

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  const accountClosureBackend = (closable: boolean) =>
    savingsFundAccountClosureBackend(server, closable);

  const closeAccountBackend = (status: number, onClose: () => void = () => {}) =>
    server.use(
      rest.post('http://localhost/v1/savings/account-closure', (_req, res, ctx) => {
        onClose();
        return res(ctx.status(status));
      }),
    );

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
  });

  it('offers to close an empty account in the status box', async () => {
    accountClosureBackend(true);
    initApp();
    history.push('/account');

    const closeLink = await screen.findByRole('link', { name: 'Close account' }, { timeout: 5000 });
    expect(closeLink).toHaveAttribute('href', '/savings-fund/close');
  });

  it('does not offer to close an account that cannot be closed', async () => {
    accountClosureBackend(false);
    initApp();
    history.push('/account');

    expect(await screen.findByRole('link', { name: 'Make a payment' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Close account' })).not.toBeInTheDocument();
  });

  it('closes the account after the person confirms', async () => {
    let closed = false;
    accountClosureBackend(true);
    closeAccountBackend(204, () => {
      closed = true;
    });
    initApp();
    history.push('/savings-fund/close');

    expect(
      await screen.findByRole('heading', { name: 'Close your Additional Investment Fund account' }),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Close account' }));

    expect(await screen.findByText('Your account is closed')).toBeInTheDocument();
    expect(closed).toBe(true);
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  });

  it('lets the person start onboarding again right after closing', async () => {
    let personStatus = 'COMPLETED';
    server.use(
      rest.get('http://localhost/v1/savings/onboarding/status/person', (_req, res, ctx) =>
        res(ctx.json({ status: personStatus })),
      ),
    );
    accountClosureBackend(true);
    closeAccountBackend(204, () => {
      personStatus = 'CLOSED';
    });
    initApp();
    history.push('/savings-fund/onboarding/person');
    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/onboarding/success'));

    history.push('/savings-fund/close');
    userEvent.click(await screen.findByRole('button', { name: 'Close account' }));
    expect(await screen.findByText('Your account is closed')).toBeInTheDocument();

    history.push('/savings-fund/onboarding/person');
    await waitFor(() => expect(personStatus).toBe('CLOSED'));
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(history.location.pathname).toBe('/savings-fund/onboarding/person');
  });

  it('shows an error when the account could not be closed', async () => {
    accountClosureBackend(true);
    closeAccountBackend(409);
    initApp();
    history.push('/savings-fund/close');

    userEvent.click(await screen.findByRole('button', { name: 'Close account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not close your account. Please make sure you have no units left and no payment or withdrawal in progress.',
    );
  });

  it('leads back to the account when the account cannot be closed', async () => {
    accountClosureBackend(false);
    initApp();
    history.push('/savings-fund/close');

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
  });
});
