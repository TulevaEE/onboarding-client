import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { businessRegistryBackend, companyValidationBackend } from '../../../../test/backend';
import { mockValidatedCompany } from '../../../../test/backend-responses';
import { initializeConfiguration } from '../../../config/config';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  businessRegistryBackend(server, [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }]);
  companyValidationBackend(server);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const navigateToStep2 = async () => {
  renderWrapped(<SavingsFundCompanyOnboarding />);

  const input = screen.getByPlaceholderText('Search...');
  userEvent.type(input, 'Acme');
  const option = await screen.findByRole('option', { name: /Acme Corp/ });

  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    userEvent.click(option);
  });

  userEvent.click(screen.getByRole('button', { name: /continue/i }));

  await waitFor(() => {
    expect(screen.getByText('2/7')).toBeInTheDocument();
  });
};

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step with progress showing 1/7', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('does not fetch onboarding status before form is submitted', async () => {
    let statusRequested = false;
    server.use(
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) => {
        statusRequested = true;
        return res(ctx.json({ status: 'PENDING' }));
      }),
    );

    renderWrapped(<SavingsFundCompanyOnboarding />);

    // Wait a tick to ensure no request fires
    await waitFor(() => {
      expect(screen.getByText('1/7')).toBeInTheDocument();
    });

    expect(statusRequested).toBe(false);
  });

  it('has Continue and Back buttons', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('does not advance past step 1 when no company is selected', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('1/7')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
  });

  it('stays on step 1 when Back is clicked on the first step', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('does not advance past step 2 when backend validation fails', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: { value: 'INVALID', errors: ['INVALID_STATUS'] },
          }),
        ),
      ),
    );

    await navigateToStep2();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    });

    expect(screen.getByText('2/7')).toBeInTheDocument();
  });

  it('submits survey on the last step and redirects to success', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);

    const user = userEvent;
    const continueButton = screen.getByRole('button', { name: /continue/i });

    // Step 1: Business Registry - select company
    const input = screen.getByPlaceholderText('Search...');
    user.type(input, 'Acme');
    const option = await screen.findByRole('option', { name: /Acme Corp/ });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(option);
    });
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('2/7')).toBeInTheDocument();
    });

    // Step 2: Requirements Check - wait for validation data to load
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(continueButton);
    });
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
    });

    // Step 3: Company Address - no fields to fill
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('4/7')).toBeInTheDocument();
    });

    // Step 4: Investment Goal
    const longTermRadio = screen.getByRole('radio', {
      name: 'Long-term investment, including pension',
    });
    user.click(longTermRadio);
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('5/7')).toBeInTheDocument();
    });

    // Step 5: Investable Assets
    const assetsRadio = screen.getByRole('radio', { name: '€20,001–€40,000' });
    user.click(assetsRadio);
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('6/7')).toBeInTheDocument();
    });

    // Step 6: Company Income Source
    const checkbox1 = screen.getByRole('checkbox', {
      name: /operates only in Estonia/i,
    });
    const checkbox2 = screen.getByRole('checkbox', {
      name: /not sanctioned and does not do business/i,
    });
    const checkbox3 = screen.getByRole('checkbox', {
      name: /not involved in cryptocurrency/i,
    });
    user.click(checkbox1);
    user.click(checkbox2);
    user.click(checkbox3);
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('7/7')).toBeInTheDocument();
    });

    // Step 7: Terms
    const termsCheckbox = screen.getByRole('checkbox');
    user.click(termsCheckbox);

    // Set up survey POST handler and status to return COMPLETED after submit
    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    user.click(continueButton);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
  });

  it('includes registry code as query parameter in survey POST', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    const user = userEvent;
    const continueButton = screen.getByRole('button', { name: /continue/i });

    const input = screen.getByPlaceholderText('Search...');
    user.type(input, 'Acme');
    const option = await screen.findByRole('option', { name: /Acme Corp/ });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(option);
    });
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('2/7')).toBeInTheDocument();
    });

    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(continueButton);
    });
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
    });

    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('4/7')).toBeInTheDocument();
    });

    user.click(screen.getByRole('radio', { name: 'Long-term investment, including pension' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('5/7')).toBeInTheDocument();
    });

    user.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('6/7')).toBeInTheDocument();
    });

    user.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
    user.click(screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }));
    user.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('7/7')).toBeInTheDocument();
    });

    user.click(screen.getByRole('checkbox'));

    let surveyRequestUrl: string | null = null;
    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (req, res, ctx) => {
        surveyRequestUrl = req.url.toString();
        return res(ctx.status(200));
      }),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    user.click(continueButton);

    await waitFor(() => {
      expect(surveyRequestUrl).toContain('registry-code=12345678');
    });
  });

  it('POSTs survey data to /v1/kyb/surveys on the last step', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    const user = userEvent;
    const continueButton = screen.getByRole('button', { name: /continue/i });

    // Step 1: Business Registry - select company
    const input = screen.getByPlaceholderText('Search...');
    user.type(input, 'Acme');
    const option = await screen.findByRole('option', { name: /Acme Corp/ });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(option);
    });
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('2/7')).toBeInTheDocument();
    });

    // Step 2: Requirements Check
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(continueButton);
    });
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
    });

    // Step 3: Company Address
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('4/7')).toBeInTheDocument();
    });

    // Step 4: Investment Goal
    user.click(screen.getByRole('radio', { name: 'Long-term investment, including pension' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('5/7')).toBeInTheDocument();
    });

    // Step 5: Investable Assets
    user.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('6/7')).toBeInTheDocument();
    });

    // Step 6: Company Income Source
    user.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
    user.click(screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }));
    user.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('7/7')).toBeInTheDocument();
    });

    // Step 7: Terms
    user.click(screen.getByRole('checkbox'));

    // Capture POST request body
    let surveyRequestBody: Record<string, unknown> | null = null;
    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (req, res, ctx) => {
        surveyRequestBody = req.body as Record<string, unknown>;
        return res(ctx.status(200));
      }),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    user.click(continueButton);

    await waitFor(() => {
      expect(surveyRequestBody).not.toBeNull();
    });
    expect(surveyRequestBody).toEqual(
      expect.objectContaining({
        answers: expect.arrayContaining([
          expect.objectContaining({ type: 'BUSINESS_REGISTRY_NUMBER' }),
        ]),
      }),
    );
  });

  it('displays an error when survey submission fails', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    const user = userEvent;
    const continueButton = screen.getByRole('button', { name: /continue/i });

    // Step 1: Business Registry
    const input = screen.getByPlaceholderText('Search...');
    user.type(input, 'Acme');
    const option = await screen.findByRole('option', { name: /Acme Corp/ });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(option);
    });
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('2/7')).toBeInTheDocument();
    });

    // Step 2: Requirements Check
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(continueButton);
    });
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
    });

    // Step 3: Company Address
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('4/7')).toBeInTheDocument();
    });

    // Step 4: Investment Goal
    user.click(screen.getByRole('radio', { name: 'Long-term investment, including pension' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('5/7')).toBeInTheDocument();
    });

    // Step 5: Investable Assets
    user.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('6/7')).toBeInTheDocument();
    });

    // Step 6: Company Income Source
    user.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
    user.click(screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }));
    user.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('7/7')).toBeInTheDocument();
    });

    // Step 7: Terms
    user.click(screen.getByRole('checkbox'));

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' })),
      ),
    );

    user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('disables the continue button while survey is being submitted', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    const user = userEvent;
    const continueButton = screen.getByRole('button', { name: /continue/i });

    // Step 1: Business Registry
    const input = screen.getByPlaceholderText('Search...');
    user.type(input, 'Acme');
    const option = await screen.findByRole('option', { name: /Acme Corp/ });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(option);
    });
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('2/7')).toBeInTheDocument();
    });

    // Step 2: Requirements Check
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      user.click(continueButton);
    });
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
    });

    // Step 3: Company Address
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('4/7')).toBeInTheDocument();
    });

    // Step 4: Investment Goal
    user.click(screen.getByRole('radio', { name: 'Long-term investment, including pension' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('5/7')).toBeInTheDocument();
    });

    // Step 5: Investable Assets
    user.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('6/7')).toBeInTheDocument();
    });

    // Step 6: Company Income Source
    user.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
    user.click(screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }));
    user.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
    user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByText('7/7')).toBeInTheDocument();
    });

    // Step 7: Terms
    user.click(screen.getByRole('checkbox'));

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) =>
        res(ctx.delay(200), ctx.status(200)),
      ),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    });
  });
});
