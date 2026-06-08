import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History } from 'history';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { rest } from 'msw';
import {
  createDefaultStore,
  login,
  renderWrapped,
  selectCountryOptionInTomSelect,
} from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackends } from '../../../../test/backend';
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

// Fills citizenship, residency, contact and PEP, leaving the wizard on the
// investment-intent step (step 5).
const fillKycIdentitySteps = async () => {
  const continueButton = await screen.findByRole('button', { name: 'Continue' });

  const select = (await screen.findByRole('listbox', {
    name: 'Choose all countries of citizenship',
  })) as HTMLSelectElement;
  selectCountryOptionInTomSelect(select, 'FI');
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Finland', selected: true })).toBeInTheDocument();
  });
  userEvent.click(continueButton);

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
  userEvent.click(continueButton);

  expect(
    await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
  ).toBeInTheDocument();
  userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com');
  userEvent.click(continueButton);

  expect(
    await screen.findByRole('heading', { name: 'Are you a politically exposed person?', level: 2 }),
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole('radio', { name: 'I am not a politically exposed person' }));
  userEvent.click(continueButton);

  expect(
    await screen.findByRole('heading', { name: 'How do you want to invest?', level: 2 }),
  ).toBeInTheDocument();
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

  const submitSurveyHandler = rest.post('http://localhost/v1/kyc/surveys', (req, res, ctx) =>
    res(ctx.status(200)),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
    server.use(submitSurveyHandler);
    initApp();
    history.push('/savings-fund/onboarding');
  });

  it('allows completing the full happy flow', async () => {
    server.use(onboardingStatusHandler.notStarted());

    const user = userEvent;

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();

    const continueButton = await screen.findByRole('button', { name: 'Continue' });

    // Step 1: Citizenship - select Finland to get regular AddressForm
    expect(
      await screen.findByRole(
        'heading',
        { name: 'What is your citizenship?', level: 2 },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();

    const select = screen.getByRole('listbox', {
      name: 'Choose all countries of citizenship',
    }) as HTMLSelectElement;

    selectCountryOptionInTomSelect(select, 'FI');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Finland', selected: true })).toBeInTheDocument();
    });

    user.click(continueButton);

    // Step 2: Residency - select Finland and fill regular address form
    expect(
      await screen.findByRole('heading', { name: 'Your permanent residence', level: 2 }),
    ).toBeInTheDocument();

    const countrySelect = screen.getByRole('combobox', { name: 'Country' });
    user.selectOptions(countrySelect, 'FI');

    // Wait for the form to switch to non-Estonian address form
    const cityInput = await screen.findByRole('textbox', { name: 'City' }, { timeout: 3_000 });
    user.type(cityInput, 'Helsinki');

    const postalCodeInput = screen.getByRole('textbox', { name: 'Postal code' });
    user.type(postalCodeInput, '00100');

    const streetInput = screen.getByRole('textbox', { name: 'Address (street, house, apartment)' });
    user.type(streetInput, 'Mannerheimintie 1');

    user.click(continueButton);

    // Step 3: Contact Details
    expect(
      await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
    ).toBeInTheDocument();

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    user.type(emailInput, 'test@example.com');

    user.click(continueButton);

    // Step 4: PEP Declaration
    expect(
      await screen.findByRole('heading', {
        name: 'Are you a politically exposed person?',
        level: 2,
      }),
    ).toBeInTheDocument();

    const notPepRadio = screen.getByRole('radio', {
      name: 'I am not a politically exposed person',
    });
    user.click(notPepRadio);

    user.click(continueButton);

    // Step 5: Investment Goals
    expect(
      await screen.findByRole('heading', { name: 'What is your investment goal?', level: 2 }),
    ).toBeInTheDocument();

    const longTermRadio = screen.getByRole('radio', {
      name: 'Long-term investment, including pension',
    });
    user.click(longTermRadio);

    user.click(continueButton);

    // Step 6: Investable Assets
    expect(
      await screen.findByRole('heading', {
        name: 'How much investable assets do you have?',
        level: 2,
      }),
    ).toBeInTheDocument();

    const assetsRadio = screen.getByRole('radio', { name: '€20,001–€40,000' });
    user.click(assetsRadio);

    user.click(continueButton);

    // Step 7: Income Sources
    expect(
      await screen.findByRole('heading', { name: 'What are your sources of income?', level: 2 }),
    ).toBeInTheDocument();

    const salaryCheckbox = screen.getByRole('checkbox', { name: 'Salary' });
    user.click(salaryCheckbox);

    const investmentsCheckbox = screen.getByRole('checkbox', {
      name: 'Investments (securities, real estate, etc.)',
    });
    user.click(investmentsCheckbox);

    user.click(continueButton);

    // Step 8: Terms
    expect(
      await screen.findByRole('heading', { name: 'Review fund documents', level: 2 }),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Terms/i })).toHaveAttribute(
      'href',
      'https://tuleva.ee/wp-content/uploads/2026/02/Tuleva.eurofond.tingimused.02.02.2026.pdf',
    );

    const termsCheckbox = screen.getByLabelText(
      'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
    );
    user.click(termsCheckbox);

    server.use(onboardingStatusHandler.completed());

    user.click(continueButton);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
    });
  });

  it('skips profile and personal terms steps for company-only intent, omits profile items, and routes to company onboarding', async () => {
    server.use(onboardingStatusHandler.notStarted());
    history.push('/savings-fund/onboarding/uus');

    let capturedAnswerTypes: string[] | null = null;
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (req, res, ctx) => {
        const body = req.body as { answers: { type: string }[] };
        capturedAnswerTypes = body.answers.map((answer) => answer.type);
        return res(ctx.status(200));
      }),
    );

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

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));

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
    server.use(onboardingStatusHandler.notStarted());
    history.push('/savings-fund/onboarding/uus');

    await fillKycIdentitySteps();

    // Step 5: Investment Intent - choose both personal and company
    userEvent.click(screen.getByRole('radio', { name: 'Both personally and through my company' }));
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    userEvent.click(continueButton);

    // Step 6: Investment Goals
    userEvent.click(
      await screen.findByRole('radio', { name: 'Long-term investment, including pension' }),
    );
    userEvent.click(continueButton);

    // Step 7: Investable Assets
    userEvent.click(await screen.findByRole('radio', { name: '€20,001–€40,000' }));
    userEvent.click(continueButton);

    // Step 8: Income Sources
    userEvent.click(await screen.findByRole('checkbox', { name: 'Salary' }));
    userEvent.click(continueButton);

    // Step 9: Terms
    userEvent.click(
      await screen.findByLabelText(
        'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
      ),
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/company/onboarding');
    });
    expect((history.location.state as { fromBothFlow?: boolean } | undefined)?.fromBothFlow).toBe(
      true,
    );

    // The KYB destination must actually render. Before the fix the wizard
    // crashed on this transition (white screen), so asserting only the pathname
    // was a false green — assert the company step's UI is on screen.
    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('allows navigation back through steps', async () => {
    server.use(onboardingStatusHandler.notStarted());

    const user = userEvent;

    expect(screen.getByText('1/8')).toBeInTheDocument();

    const select = (await screen.findByRole('listbox', {
      name: 'Choose all countries of citizenship',
    })) as HTMLSelectElement;

    selectCountryOptionInTomSelect(select, 'FI');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Finland', selected: true })).toBeInTheDocument();
    });

    // Go forward to step 2
    user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('2/8')).toBeInTheDocument();
    });

    // Go back to step 1
    user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Go back from first step should navigate to /account
    user.click(screen.getByRole('button', { name: 'Back' }));
    expect(history.location.pathname).toBe('/account');
  });

  it('shows pending outcome when onboarding status is pending', async () => {
    server.use(onboardingStatusHandler.pending());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });

    expect(screen.getByRole('heading', { name: 'Application under review' })).toBeInTheDocument();
  });

  it('hides navigation buttons while loading onboarding status', async () => {
    server.use(onboardingStatusHandler.delayed());

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  const onboardingStatusHandler = {
    notStarted: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: null })),
      ),
    pending: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    completed: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    delayed: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.delay('infinite')),
      ),
  };
});
