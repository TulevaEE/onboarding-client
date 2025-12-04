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
      await screen.findByRole('heading', { name: 'Review the terms', level: 2 }),
    ).toBeInTheDocument();
    const termsCheckbox = screen.getByLabelText('I confirm that I have reviewed the terms');
    user.click(termsCheckbox);

    server.use(onboardingStatusHandler.completed());

    user.click(continueButton);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
    });
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

  it('goes to account page if user is not whitelisted', async () => {
    server.use(onboardingStatusHandler.null());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
  });

  const onboardingStatusHandler = {
    notStarted: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'WHITELISTED' })),
      ),
    pending: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    completed: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    null: () =>
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: null })),
      ),
  };
});
