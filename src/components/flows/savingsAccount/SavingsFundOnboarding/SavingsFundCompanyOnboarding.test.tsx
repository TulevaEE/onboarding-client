import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  businessRegistryBackend,
  companyValidationBackend,
  switchRoleBackend,
  userBackend,
} from '../../../../test/backend';
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
  userBackend(server);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step with progress showing 1/7', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Enter your company's name",
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

    expect(await screen.findByText('1/7')).toBeInTheDocument();
    expect(statusRequested).toBe(false);
  });

  it('has Continue and Back buttons', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(continueButton()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('does not advance past step 1 when no company is selected', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(continueButton());

    expect(await screen.findByText('1/7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Enter your company's name",
    );
  });

  it('goes back to the previous page when Back is clicked on the first step', () => {
    const history = createMemoryHistory({
      initialEntries: ['/savings-fund/onboarding', '/savings-fund/onboarding/company'],
      initialIndex: 1,
    });
    renderWrapped(<SavingsFundCompanyOnboarding />, history);

    userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });

  it('does not advance past step 2 when backend validation fails', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: {
              value: 'INVALID',
              errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
            },
          }),
        ),
      ),
    );

    await navigateToStep2();

    userEvent.click(continueButton());

    expect(await screen.findByText('2/7')).toBeInTheDocument();
  });

  it('switches to the company account and opens the deposit view when KYB completes', async () => {
    const switchBackend = switchRoleBackend(server);
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    userEvent.click(continueButton());

    // A completed company KYB lands directly on the company's deposit view
    // (no account chooser for the standalone path), not the "in review" page.
    await waitFor(() => {
      expect(switchBackend.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '12345678' });
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/payment');
    });
  });

  it('shows the pending page when the company KYB is rejected', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'REJECTED' })),
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
  });

  it('includes registry code as query parameter in survey POST', async () => {
    switchRoleBackend(server);
    await navigateToStep2();
    await completeStepsThroughTerms();

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

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(surveyRequestUrl).toContain('registry-code=12345678');
    });
  });

  it('POSTs survey data to /v1/kyb/surveys on the last step', async () => {
    switchRoleBackend(server);
    await navigateToStep2();
    await completeStepsThroughTerms();

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

    userEvent.click(continueButton());

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

  it('submits an ASSET_MANAGEMENT option when the asset-management goal is chosen', async () => {
    switchRoleBackend(server);
    renderWrapped(<SavingsFundCompanyOnboarding />);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTermsWithGoal(() =>
      userEvent.click(
        screen.getByRole('radio', { name: 'Investing surplus cash (asset management)' }),
      ),
    );

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

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(surveyRequestBody).not.toBeNull();
    });
    expect(surveyRequestBody).toEqual(
      expect.objectContaining({
        answers: expect.arrayContaining([
          { type: 'INVESTMENT_GOALS', value: { type: 'OPTION', value: 'ASSET_MANAGEMENT' } },
        ]),
      }),
    );
  });

  it('submits free text when "Other" is chosen as the company investment goal', async () => {
    switchRoleBackend(server);
    renderWrapped(<SavingsFundCompanyOnboarding />);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTermsWithGoal(() => {
      userEvent.click(screen.getByRole('radio', { name: /Other/ }));
      userEvent.type(screen.getByRole('textbox'), 'Soovin investeerida kinnisvarasse');
    });

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

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(surveyRequestBody).not.toBeNull();
    });
    expect(surveyRequestBody).toEqual(
      expect.objectContaining({
        answers: expect.arrayContaining([
          {
            type: 'INVESTMENT_GOALS',
            value: { type: 'TEXT', value: 'Soovin investeerida kinnisvarasse' },
          },
        ]),
      }),
    );
  });

  it('displays an error when survey submission fails', async () => {
    await navigateToStep2();
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' })),
      ),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('disables the continue button while survey is being submitted', async () => {
    switchRoleBackend(server);
    await navigateToStep2();
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) =>
        res(ctx.delay(200), ctx.status(200)),
      ),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(continueButton()).toBeDisabled();
    });
  });

  it('disables Continue on the requirements step while the company fails validation', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: {
              value: 'DELETED',
              errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
            },
          }),
        ),
      ),
    );
    await navigateToStep2();

    expect(await screen.findByText('Company status is invalid')).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
  });

  it('does not show the confirmations error until the user tries to continue', async () => {
    await navigateToStep2();
    await advanceToConfirmations();

    // Ticking only the first confirmation must not surface the "confirm all" error yet
    const estoniaCheckbox = screen.getByRole('checkbox', { name: /operates only in Estonia/i });
    userEvent.click(estoniaCheckbox);
    await waitFor(() => expect(estoniaCheckbox).toBeChecked());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // The error appears only when the user tries to continue with boxes unchecked
    userEvent.click(continueButton());
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows the on-behalf-of-company confirmation text on the terms step', async () => {
    await navigateToStep2();
    await advanceToTerms();

    expect(
      screen.getByText(/I confirm on behalf of the company that I have reviewed the documents/i),
    ).toBeInTheDocument();
  });

  it('keeps the submit button disabled until the company terms are accepted', async () => {
    await navigateToStep2();
    await advanceToTerms();

    expect(continueButton()).toBeDisabled();

    userEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(continueButton()).toBeEnabled();
    });
  });
});

const continueButton = () => screen.getByRole('button', { name: /continue/i });

const selectCompany = async () => {
  userEvent.type(screen.getByPlaceholderText('Search...'), 'Acme');
  userEvent.click(await screen.findByRole('option', { name: /Acme Corp/ }));
};

const advanceToStep = async (step: number) => {
  userEvent.click(continueButton());
  expect(await screen.findByText(`${step}/7`)).toBeInTheDocument();
};

const navigateToStep2 = async () => {
  renderWrapped(<SavingsFundCompanyOnboarding />);
  await selectCompany();
  await advanceToStep(2);
};

// Advances from step 2 through to the terms step (7/7) without accepting the terms.
const advanceToTerms = async () => {
  // Step 2: Requirements Check — wait for validation data before continuing
  expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
  await advanceToStep(3);

  // Step 3: Company Address — no fields to fill
  await advanceToStep(4);

  // Step 4: Investment Goal
  userEvent.click(screen.getByRole('radio', { name: 'Long-term growth of company assets' }));
  await advanceToStep(5);

  // Step 5: Investable Assets
  userEvent.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
  await advanceToStep(6);

  // Step 6: Company Income Source
  userEvent.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
  userEvent.click(
    screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }),
  );
  userEvent.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
  await advanceToStep(7);
};

// Continues from step 2 through step 7, ending with the terms checkbox checked.
const completeStepsThroughTerms = async () => {
  await advanceToTerms();
  // Step 7: Terms
  userEvent.click(screen.getByRole('checkbox'));
};

// Like completeStepsThroughTerms, but the investment goal at step 4 is chosen
// by the provided callback instead of defaulting to the long-term option.
const completeStepsThroughTermsWithGoal = async (pickGoal: () => void) => {
  expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
  await advanceToStep(3);
  await advanceToStep(4);
  pickGoal();
  await advanceToStep(5);
  userEvent.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
  await advanceToStep(6);
  userEvent.click(screen.getByRole('checkbox', { name: /operates only in Estonia/i }));
  userEvent.click(
    screen.getByRole('checkbox', { name: /not sanctioned and does not do business/i }),
  );
  userEvent.click(screen.getByRole('checkbox', { name: /not involved in cryptocurrency/i }));
  await advanceToStep(7);
  userEvent.click(screen.getByRole('checkbox'));
};

// Advances from step 2 to the confirmations step (6/7) without ticking any box.
const advanceToConfirmations = async () => {
  expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
  await advanceToStep(3);
  await advanceToStep(4);
  userEvent.click(screen.getByRole('radio', { name: 'Long-term growth of company assets' }));
  await advanceToStep(5);
  userEvent.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
  await advanceToStep(6);
};
