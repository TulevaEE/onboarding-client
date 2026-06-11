import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History } from 'history';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import {
  delayedSavingsFundOnboardingStatusBackend,
  failingKycIdentityBackend,
  kycIdentityBackend,
  savingsFundOnboardingStatusBackend,
  savingsFundOnboardingSurveyBackend,
  useTestBackends,
} from '../../../../test/backend';
import {
  mockCompleteKycIdentity,
  mockContactOnlyKycIdentity,
} from '../../../../test/backend-responses';
import LoggedInApp from '../../../LoggedInApp';
import {
  clickContinue,
  fillCitizenshipStep,
  fillContactDetailsStep,
  fillPepStep,
  fillPersonalProfileSteps,
  fillResidencyStep,
  mockInAadress,
} from '../../../../test/identityStepFills';

mockInAadress();

describe('SavingsFundOnboarding', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  const openOnboardingFlow = () => {
    history.push('/savings-fund/onboarding/person');
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
    savingsFundOnboardingSurveyBackend(server);
    initApp();
  });

  it('allows completing the full happy flow', async () => {
    savingsFundOnboardingStatusBackend(server);
    openOnboardingFlow();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'heading',
        { name: 'What is your citizenship?', level: 2 },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();

    await fillCitizenshipStep();
    await fillResidencyStep();
    await fillContactDetailsStep();
    await fillPepStep();

    expect(
      await screen.findByRole('heading', { name: 'What is your investment goal?', level: 2 }),
    ).toBeInTheDocument();
    await fillPersonalProfileSteps();

    expect(
      screen.getByRole('heading', { name: 'Review fund documents', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms/i })).toHaveAttribute(
      'href',
      'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
    );

    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    clickContinue();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
    });
  });

  it('allows navigation back through steps', async () => {
    savingsFundOnboardingStatusBackend(server);
    openOnboardingFlow();

    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Go forward to step 2
    await fillCitizenshipStep();

    await waitFor(() => {
      expect(screen.getByText('2/8')).toBeInTheDocument();
    });

    // Go back to step 1
    userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Go back from first step should navigate to the account page until the
    // chooser is live
    userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(history.location.pathname).toBe('/account');
  });

  it('shows pending outcome when onboarding status is pending', async () => {
    savingsFundOnboardingStatusBackend(server, 'PENDING');
    openOnboardingFlow();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });

    expect(screen.getByRole('heading', { name: 'Application under review' })).toBeInTheDocument();
  });

  it('renders the personal flow at the root onboarding path before the company launch', async () => {
    savingsFundOnboardingStatusBackend(server);
    history.push('/savings-fund/onboarding');

    expect(await screen.findByText('1/8')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Who are you opening the account for?' }),
    ).not.toBeInTheDocument();
  });

  it('redirects the company route to the root personal flow before the company launch', async () => {
    savingsFundOnboardingStatusBackend(server);
    history.push('/savings-fund/onboarding/company');

    expect(await screen.findByText('1/8')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });

  it('hides navigation buttons while loading onboarding status', async () => {
    delayedSavingsFundOnboardingStatusBackend(server);
    openOnboardingFlow();

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  it('skips identity steps and submits the identity on file when identity is complete', async () => {
    savingsFundOnboardingStatusBackend(server);
    kycIdentityBackend(server, mockCompleteKycIdentity);

    let capturedAnswers: unknown[] | null = null;
    savingsFundOnboardingSurveyBackend(server, (body) => {
      capturedAnswers = body.answers;
    });
    openOnboardingFlow();

    expect(
      await screen.findByRole('heading', { name: 'What is your investment goal?', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();

    await fillPersonalProfileSteps();
    savingsFundOnboardingStatusBackend(server, 'COMPLETED');
    clickContinue();

    await waitFor(() => {
      expect(capturedAnswers).not.toBeNull();
    });
    expect(capturedAnswers).toEqual(
      expect.arrayContaining([
        { type: 'CITIZENSHIP', value: { type: 'COUNTRIES', value: ['FI'] } },
        {
          type: 'ADDRESS',
          value: {
            type: 'ADDRESS',
            value: {
              street: 'Mannerheimintie 1',
              city: 'Helsinki',
              postalCode: '00100',
              countryCode: 'FI',
            },
          },
        },
        { type: 'EMAIL', value: { type: 'TEXT', value: 'onfile@example.com' } },
        { type: 'PHONE_NUMBER', value: { type: 'TEXT', value: '+358501234567' } },
        { type: 'PEP_SELF_DECLARATION', value: { type: 'OPTION', value: 'IS_NOT_PEP' } },
        { type: 'INVESTMENT_GOALS', value: { type: 'OPTION', value: 'LONG_TERM' } },
      ]),
    );

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
    });
  });

  it('prefills contact details from the identity on file', async () => {
    savingsFundOnboardingStatusBackend(server);
    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    openOnboardingFlow();

    expect(await screen.findByText('1/8')).toBeInTheDocument();

    await fillCitizenshipStep();
    await fillResidencyStep();

    expect(
      await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('onfile@example.com');
    expect(screen.getByRole('textbox', { name: /Phone number/ })).toHaveValue('+372555555');
  });

  it('resolves the flow shape from a fresh fetch, not the cached identity, on re-entry', async () => {
    savingsFundOnboardingStatusBackend(server);
    openOnboardingFlow();

    expect(await screen.findByText('1/8')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();

    history.push('/account');
    kycIdentityBackend(server, mockCompleteKycIdentity);
    openOnboardingFlow();

    expect(await screen.findByText('1/4')).toBeInTheDocument();
  });

  it('blocks the flow and offers retry when loading the identity fails', async () => {
    savingsFundOnboardingStatusBackend(server);
    failingKycIdentityBackend(server);
    openOnboardingFlow();

    expect(
      await screen.findByText("We couldn't load your details. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('listbox', { name: 'Choose all countries of citizenship' }),
    ).not.toBeInTheDocument();

    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('listbox', { name: 'Choose all countries of citizenship' }),
    ).toBeInTheDocument();
  });
});
