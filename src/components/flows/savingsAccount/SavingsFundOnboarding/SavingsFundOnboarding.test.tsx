import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History } from 'history';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import {
  createDefaultStore,
  login,
  renderWrapped,
  selectCountryOptionInTomSelect,
} from '../../../../test/utils';
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

// Mock the InAadress global used by EstonianAddressForm
(global as any).InAadress = jest.fn().mockImplementation((config: any) => {
  // Create a simple input element in the container
  // eslint-disable-next-line testing-library/no-node-access
  const container = document.getElementById(config.container);
  if (container) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.placeholder = 'Enter address';
    container.appendChild(input);
  }

  return {
    destroy: jest.fn(),
  };
});

const clickContinue = () => {
  userEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

// Selects Finland so the residency step shows the regular (non-Estonian)
// address form, and continues.
const fillCitizenshipStep = async () => {
  const select = (await screen.findByRole('listbox', {
    name: 'Choose all countries of citizenship',
  })) as HTMLSelectElement;
  selectCountryOptionInTomSelect(select, 'FI');
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Finland', selected: true })).toBeInTheDocument();
  });
  userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
};

const fillResidencyStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Your permanent residence', level: 2 }),
  ).toBeInTheDocument();
  userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'FI');
  const cityInput = await screen.findByRole('textbox', { name: 'City' }, { timeout: 3_000 });
  userEvent.type(cityInput, 'Helsinki');
  userEvent.type(screen.getByRole('textbox', { name: 'Postal code' }), '00100');
  userEvent.type(
    screen.getByRole('textbox', { name: 'Address (street, house, apartment)' }),
    'Mannerheimintie 1',
  );
  clickContinue();
};

const fillContactDetailsStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
  ).toBeInTheDocument();
  userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
  clickContinue();
};

const fillPepStep = async () => {
  expect(
    await screen.findByRole('heading', { name: 'Are you a politically exposed person?', level: 2 }),
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole('radio', { name: 'I am not a politically exposed person' }));
  clickContinue();
};

// Fills citizenship, residency, contact and PEP, leaving the flow on the
// investment-intent step (step 5).
const fillKycIdentitySteps = async () => {
  await fillCitizenshipStep();
  await fillResidencyStep();
  await fillContactDetailsStep();
  await fillPepStep();

  expect(
    await screen.findByRole('heading', { name: 'How do you want to invest?', level: 2 }),
  ).toBeInTheDocument();
};

// Fills goals, assets and income, and ticks the terms checkbox. The final
// Continue (the submit) stays in the test, so it can swap handlers first.
const fillPersonalProfileSteps = async () => {
  userEvent.click(
    await screen.findByRole('radio', { name: 'Long-term investment, including pension' }),
  );
  clickContinue();

  userEvent.click(await screen.findByRole('radio', { name: '€20,001–€40,000' }));
  clickContinue();

  userEvent.click(await screen.findByRole('checkbox', { name: 'Salary' }));
  clickContinue();

  userEvent.click(
    await screen.findByLabelText(
      'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
    ),
  );
};

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
    history.push('/savings-fund/onboarding');
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

  it('skips profile and personal terms steps for company-only intent, omits profile items, and routes to company onboarding', async () => {
    savingsFundOnboardingStatusBackend(server);

    let capturedAnswerTypes: string[] | null = null;
    savingsFundOnboardingSurveyBackend(server, (body) => {
      capturedAnswerTypes = body.answers.map((answer) => answer.type);
    });
    history.push('/savings-fund/onboarding/uus');

    await fillKycIdentitySteps();

    // Step 5: Investment Intent - choose company-only
    userEvent.click(screen.getByRole('radio', { name: 'Only through my company' }));

    // Intent becomes the final step: profile + personal terms steps are skipped
    expect(await screen.findByText('5/5')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'What is your investment goal?' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Review fund documents' }),
    ).not.toBeInTheDocument();

    clickContinue();

    await waitFor(() => {
      expect(capturedAnswerTypes).not.toBeNull();
    });
    expect(capturedAnswerTypes).not.toContain('INVESTMENT_GOALS');
    expect(capturedAnswerTypes).not.toContain('INVESTABLE_ASSETS');
    expect(capturedAnswerTypes).not.toContain('SOURCE_OF_INCOME');
    expect(capturedAnswerTypes).toEqual(
      expect.arrayContaining(['CITIZENSHIP', 'ADDRESS', 'EMAIL', 'PEP_SELF_DECLARATION']),
    );

    // Company-only continues into the KYB flow, without the both-flow context
    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/company/onboarding');
    });
    expect((history.location.state as { fromBothFlow?: boolean } | undefined)?.fromBothFlow).toBe(
      false,
    );
  });

  it('routes to company onboarding with both-flow context after a personal + company KYC submission', async () => {
    savingsFundOnboardingStatusBackend(server);
    history.push('/savings-fund/onboarding/uus');

    await fillKycIdentitySteps();

    // Step 5: Investment Intent - choose both personal and company
    userEvent.click(screen.getByRole('radio', { name: 'Both personally and through my company' }));
    clickContinue();

    await fillPersonalProfileSteps();
    clickContinue();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/company/onboarding');
    });
    expect((history.location.state as { fromBothFlow?: boolean } | undefined)?.fromBothFlow).toBe(
      true,
    );

    // The KYB destination must actually render. Before the fix the flow
    // crashed on this transition (white screen), so asserting only the pathname
    // was a false green — assert the company step's UI is on screen.
    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
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

    // Go back from first step should navigate to /account
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
