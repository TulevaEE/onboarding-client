import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History } from 'history';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import {
  kycIdentityBackend,
  savingsFundOnboardingStatusBackend,
  savingsFundPersonOnboardingStatusBackend,
  useTestBackends,
} from '../../../../test/backend';
import { mockCompleteKycIdentity } from '../../../../test/backend-responses';
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

  it('shows all three options with personal preselected now that all have launched', async () => {
    openChooser();

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /For myself/, pressed: true })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /For my company/, pressed: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /For my child/, pressed: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('does not redirect away from the chooser when onboarding is already completed', async () => {
    savingsFundPersonOnboardingStatusBackend(server, 'COMPLETED');
    openChooser();

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });

  it('marks the personal option as opened and gates Continue on it when onboarding is completed', async () => {
    savingsFundPersonOnboardingStatusBackend(server, 'COMPLETED');
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

  it('does not mark the personal option as opened when only the acting company has onboarded', async () => {
    // Acting as a company whose own onboarding is COMPLETED: the role-sensitive
    // status endpoint says COMPLETED, but the natural person has not onboarded —
    // the personal option must stay open for selection without the Opened tag.
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    savingsFundPersonOnboardingStatusBackend(server, null);
    openChooser();

    expect(
      await screen.findByRole('heading', { name: 'Who are you opening the account for?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Opened')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /For myself/, pressed: true })).toBeInTheDocument();
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
    kycIdentityBackend(server, mockCompleteKycIdentity);
    history.push('/savings-fund/onboarding/company');

    expect(
      await screen.findByRole('heading', { name: "Enter your company's name", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('shows the company success page with a deposit CTA on the company success route', async () => {
    history.push('/savings-fund/onboarding/success/company');

    expect(
      await screen.findByRole('heading', { name: 'All set! The company account is open' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add money' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
  });
});
