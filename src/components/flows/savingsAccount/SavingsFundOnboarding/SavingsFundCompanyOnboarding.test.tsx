import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  businessRegistryBackend,
  companyValidationBackend,
  kycIdentityBackend,
  savingsFundOnboardingSurveyBackend,
  switchRoleBackend,
  userBackend,
} from '../../../../test/backend';
import {
  mockCompleteKycIdentity,
  mockContactOnlyKycIdentity,
  mockValidatedCompany,
} from '../../../../test/backend-responses';
import { initializeConfiguration } from '../../../config/config';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';
import {
  fillCitizenshipStep,
  fillContactDetailsStep,
  fillPepStep,
  fillResidencyStep,
  mockInAadress,
} from '../../../../test/identityStepFills';

mockInAadress();

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  businessRegistryBackend(server, [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }]);
  companyValidationBackend(server);
  userBackend(server);
  kycIdentityBackend(server, mockCompleteKycIdentity);
  savingsFundOnboardingSurveyBackend(server);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SavingsFundCompanyOnboarding', () => {
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

  it('ignores a cached onboarding status until this company has been submitted', async () => {
    // Onboarding a second company in the same session: a COMPLETED status is
    // still in the query cache, but it must not be mistaken for this onboarding's
    // outcome. Before a registry code is submitted the status hook reads the
    // no-code key, so seed that key to make the status genuinely visible — the
    // flow must still stay put until this onboarding is actually submitted.
    const queryClient = new QueryClient();
    queryClient.setQueryData(['savingsFundCompanyOnboardingStatus', undefined], {
      status: 'REJECTED',
    });
    const history = createMemoryHistory();

    renderWrapped(<SavingsFundCompanyOnboarding />, history, undefined, queryClient);

    expect(await screen.findByText('1/7')).toBeInTheDocument();
    expect(history.location.pathname).not.toBe('/savings-fund/onboarding/pending');
  });

  it('has Continue and Back buttons', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(await screen.findByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('does not advance past step 1 when no company is selected', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(await screen.findByRole('button', { name: /continue/i }));

    expect(await screen.findByText('1/7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Enter your company's name",
    );
  });

  it('goes back to the previous page when Back is clicked on the first step', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/savings-fund/onboarding', '/savings-fund/onboarding/company'],
      initialIndex: 1,
    });
    renderWrapped(<SavingsFundCompanyOnboarding />, history);

    userEvent.click(await screen.findByRole('button', { name: /back/i }));

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

  it('switches to the company account and shows the company success page when KYB completes', async () => {
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

    // A completed company KYB switches to the company role first, so the
    // success page's deposit CTA opens the company's deposit view (#67 F7),
    // and confirms the account is open instead of jumping straight to payment.
    await waitFor(() => {
      expect(switchBackend.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '12345678' });
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success/company');
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

  it('refreshes the requirements check when Check again is clicked', async () => {
    let validationCalls = 0;
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) => {
        validationCalls += 1;
        if (validationCalls === 1) {
          return res(
            ctx.json({
              ...mockValidatedCompany,
              relatedPersons: {
                ...mockValidatedCompany.relatedPersons,
                errors: [
                  {
                    code: 'OTHER_RELATED_PERSONS_KYC',
                    message: 'Related persons are not identified',
                  },
                ],
              },
            }),
          );
        }
        return res(ctx.json(mockValidatedCompany));
      }),
    );
    await navigateToStep2();

    expect(await screen.findByRole('button', { name: 'Check again' })).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();

    userEvent.click(screen.getByRole('button', { name: 'Check again' }));

    await waitFor(() => {
      expect(continueButton()).toBeEnabled();
    });
    expect(screen.queryByRole('button', { name: 'Check again' })).not.toBeInTheDocument();
  });

  it('collects identity before the company steps when it is not on file', async () => {
    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    let captured: { purpose?: string; answers: { type: string }[] } | null = null;
    savingsFundOnboardingSurveyBackend(server, (body) => {
      captured = body;
    });

    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(await screen.findByText('1/11')).toBeInTheDocument();

    await fillCitizenshipStep();
    await fillResidencyStep();
    await fillContactDetailsStep();
    await fillPepStep();

    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(screen.getByText('5/11')).toBeInTheDocument();

    const capturedBody = captured as unknown as {
      purpose?: string;
      answers: { type: string }[];
    } | null;
    expect(capturedBody).not.toBeNull();
    expect(capturedBody?.purpose).toBe('IDENTITY_ONLY');
    const types = (capturedBody?.answers ?? []).map((answer) => answer.type);
    expect(types).toEqual(
      expect.arrayContaining(['CITIZENSHIP', 'ADDRESS', 'EMAIL', 'PEP_SELF_DECLARATION']),
    );
    expect(types).not.toContain('INVESTMENT_GOALS');
    expect(types).not.toContain('SOURCE_OF_INCOME');
  });

  it('starts directly at the registry step when identity is on file', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('stays on the identity steps and shows an error when the identity submission fails', async () => {
    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (_req, res, ctx) => res(ctx.status(500))),
    );

    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(await screen.findByText('1/11')).toBeInTheDocument();

    await fillCitizenshipStep();
    await fillResidencyStep();
    await fillContactDetailsStep();
    await fillPepStep();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Are you a politically exposed person?', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('4/11')).toBeInTheDocument();
  });
});

const continueButton = () => screen.getByRole('button', { name: /continue/i });

const selectCompany = async () => {
  userEvent.type(await screen.findByPlaceholderText('Search...'), 'Acme');
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
