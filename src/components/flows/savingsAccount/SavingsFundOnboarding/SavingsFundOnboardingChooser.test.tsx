import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History } from 'history';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { savingsFundOnboardingStatusBackend, useTestBackends } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

describe('SavingsFundOnboardingChooser', () => {
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
  // The chooser is the post-launch root; tests run in the team-preview state
  // (the same mechanism the shareable ?companyOnboardingPreview=true link uses).
  beforeEach(async () => {
    sessionStorage.setItem('companyOnboardingPreview', 'true');
    initializeConfiguration();
    useTestBackends(server);
    initApp();
  });
  afterEach(() => {
    sessionStorage.removeItem('companyOnboardingPreview');
  });

  const openChooser = () => {
    history.push('/savings-fund/onboarding');
  };

  it('shows the options with personal preselected and child as coming soon', async () => {
    openChooser();

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /For myself/, pressed: true })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /For my company/, pressed: false }),
    ).toBeInTheDocument();
    expect(screen.getByText('For my child')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /For my child/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(1);
  });

  it('does not redirect away from the chooser when onboarding is already completed', async () => {
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    openChooser();

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });

  it('marks the personal option as opened and gates Continue on it when onboarding is completed', async () => {
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    openChooser();

    expect(await screen.findByText('Opened')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /For my company/, pressed: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();

    userEvent.click(screen.getByRole('button', { name: /For myself/ }));

    expect(screen.getByRole('button', { name: /For myself/, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('continues to the personal flow with the preselected option', async () => {
    openChooser();

    userEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(history.location.pathname).toBe('/savings-fund/onboarding/person');
  });

  it('continues to the company flow after selecting the company option', async () => {
    openChooser();

    userEvent.click(await screen.findByRole('button', { name: /For my company/ }));
    expect(
      screen.getByRole('button', { name: /For my company/, pressed: true }),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(history.location.pathname).toBe('/savings-fund/onboarding/company');
  });

  it('renders the company flow on the company route', async () => {
    history.push('/savings-fund/onboarding/company');

    expect(
      await screen.findByRole('heading', { name: "Enter your company's name", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('redirects the reserved child route back to the chooser', async () => {
    history.push('/savings-fund/onboarding/child');

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });
});
