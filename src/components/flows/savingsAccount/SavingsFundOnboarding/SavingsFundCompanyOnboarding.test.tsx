import { QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryHistory, createMemoryHistory } from 'history';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { captureException } from '@sentry/browser';
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
import { SavingsFundOnboardingStatus } from '../../../common/apiModels';
import { ValidationError } from '../../../common/apiModels/company-onboarding';
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

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  (captureException as jest.Mock).mockClear();
  businessRegistryBackend(server, [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }]);
  companyValidationBackend(server);
  userBackend(server);
  kycIdentityBackend(server, mockCompleteKycIdentity);
  savingsFundOnboardingSurveyBackend(server);
});
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
});
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
    const history = createMemoryHistory();

    renderWrapped(
      <SavingsFundCompanyOnboarding />,
      history,
      undefined,
      clientHoldingAStaleStatus('REJECTED'),
    );

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

  it('opens the account when the onboarding completes while the validation report is read', async () => {
    const switchBackend = switchRoleBackend(server);
    const reportRequests = completeTheOnboardingOnceTheReportIsRead([OTHER_PERSONS_KYC_ERROR]);
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(switchBackend.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '12345678' });
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success/company');
    });
    expect(reportRequests.count).toBe(2);
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

  it('shows the waiting page when the company is only waiting for a verification', async () => {
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
  });

  it('shows the waiting page when only other connected people are unverified', async () => {
    respondWithRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR);
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
  });

  it('shows the review page when the applicant`s own identity verification is outstanding', async () => {
    respondWithRelatedPersonErrors(USER_KYC_ERROR);
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
  });

  it('shows the review page when the applicant is unverified alongside other people', async () => {
    respondWithRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR, USER_KYC_ERROR);
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
  });

  it('shows the waiting page when the applicant`s own verification resolved while they filled the form', async () => {
    relatedPersonErrorsChangeWhileTheApplicantFillsTheForm(
      [USER_KYC_ERROR],
      [OTHER_PERSONS_KYC_ERROR],
    );
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
  });

  it('shows the review page when the applicant`s own verification fell behind while they filled the form', async () => {
    relatedPersonErrorsChangeWhileTheApplicantFillsTheForm(
      [OTHER_PERSONS_KYC_ERROR],
      [USER_KYC_ERROR],
    );
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
  });

  it('routes on a report read after submission, not on a check-again request still in flight', async () => {
    let releaseCheckAgain = () => {};
    const checkAgainReleased = new Promise<void>((resolve) => {
      releaseCheckAgain = resolve;
    });
    const heldCheckAgainReport = reportWithRelatedPersonErrors([USER_KYC_ERROR]);
    const reportRequests = { count: 0 };
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', async (_req, res, ctx) => {
        reportRequests.count += 1;
        if (reportRequests.count === 2) {
          await checkAgainReleased;
          return res(ctx.json(heldCheckAgainReport));
        }
        return res(ctx.json(reportWithRelatedPersonErrors([OTHER_PERSONS_KYC_ERROR])));
      }),
    );
    const history = createMemoryHistory();
    const queryClient = new QueryClient();
    renderWrapped(<SavingsFundCompanyOnboarding />, history, undefined, queryClient);
    await selectCompany();
    await advanceToStep(2);
    await waitForValidationReport();

    userEvent.click(await screen.findByRole('button', { name: 'Check again' }));
    await waitFor(() => {
      expect(reportRequests.count).toBe(2);
    });
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
    expect(reportRequests.count).toBe(3);

    releaseCheckAgain();

    await waitFor(() => {
      expect(queryClient.getQueryData(['companyBusinessRegistryValidation', '12345678'])).toEqual(
        heldCheckAgainReport,
      );
    });
    expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
  });

  it('falls back to the requirements-step report when it cannot be refreshed at submission time', async () => {
    const reportRequests = failToRefreshTheReportAfterTheRequirementsStep([USER_KYC_ERROR]);
    const history = createMemoryHistory();

    await submitApplicationThatGoesPending(history);

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
    expect(reportRequests.count).toBe(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('falls back to the requirements-step report when the refresh never answers', async () => {
    let releaseTheHungReport = () => {};
    const hungReportReleased = new Promise<void>((resolve) => {
      releaseTheHungReport = resolve;
    });
    let announceTheHungReportRequest = () => {};
    const hungReportRequested = new Promise<void>((resolve) => {
      announceTheHungReportRequest = resolve;
    });
    let reportRequests = 0;
    let hungReportDelivered = false;
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', async (_req, res, ctx) => {
        reportRequests += 1;
        if (reportRequests === 1) {
          return res(ctx.json(reportWithRelatedPersonErrors([USER_KYC_ERROR])));
        }
        announceTheHungReportRequest();
        await hungReportReleased;
        hungReportDelivered = true;
        return res(ctx.json(reportWithRelatedPersonErrors([OTHER_PERSONS_KYC_ERROR])));
      }),
    );
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    );

    jest.useFakeTimers();
    userEvent.click(continueButton());
    await act(async () => {
      await hungReportRequested;
    });
    act(() => {
      jest.advanceTimersByTime(LONGER_THAN_ANY_REPORT_DEADLINE);
    });
    jest.useRealTimers();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    releaseTheHungReport();

    await waitFor(() => {
      expect(hungReportDelivered).toBe(true);
    });
    expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    expect(reportRequests).toBe(2);
  });

  it('cancels the report request that missed the deadline', async () => {
    const { abortedRequestUrls, stopObservingAbortedRequests } = observeAbortedRequests();
    let releaseTheHungReport = () => {};
    const hungReportReleased = new Promise<void>((resolve) => {
      releaseTheHungReport = resolve;
    });
    let announceTheHungReportRequest = () => {};
    const hungReportRequested = new Promise<void>((resolve) => {
      announceTheHungReportRequest = resolve;
    });
    let reportRequests = 0;
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', async (_req, res, ctx) => {
        reportRequests += 1;
        if (reportRequests === 1) {
          return res(ctx.json(reportWithRelatedPersonErrors([USER_KYC_ERROR])));
        }
        announceTheHungReportRequest();
        await hungReportReleased;
        return res(ctx.json(reportWithRelatedPersonErrors([OTHER_PERSONS_KYC_ERROR])));
      }),
    );
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    );

    jest.useFakeTimers();
    userEvent.click(continueButton());
    await act(async () => {
      await hungReportRequested;
    });
    expect(abortedRequestUrls).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(LONGER_THAN_ANY_REPORT_DEADLINE);
    });
    jest.useRealTimers();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
    expect(abortedRequestUrls).toEqual([
      expect.stringContaining('/v1/kyb/surveys/initial-validation'),
    ]);

    releaseTheHungReport();
    stopObservingAbortedRequests();
  });

  it('shows an error instead of a pending page when the submitted application has no status', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: null })),
      ),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/');
  });

  it('lets the applicant continue past the requirements step while a connected person is unverified', async () => {
    respondWithRelatedPersonErrors(OTHER_PERSONS_KYC_ERROR);

    await navigateToStep2();
    await waitForValidationReport();

    expect(continueButton()).toBeEnabled();

    userEvent.click(continueButton());

    expect(await screen.findByText('3/7')).toBeInTheDocument();
  });

  it('still blocks the applicant when the company itself fails a check', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: {
              value: 'INVALID',
              errors: [{ code: 'COMPANY_ACTIVE', message: 'Ettevõte ei ole aktiivne' }],
            },
          }),
        ),
      ),
    );

    await navigateToStep2();

    await waitFor(() => {
      expect(continueButton()).toBeDisabled();
    });
  });

  it('does not let the applicant walk back while the application is in flight', async () => {
    let releaseSubmit = () => {};
    const submitReleased = new Promise<void>((resolve) => {
      releaseSubmit = resolve;
    });
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', async (_req, res, ctx) => {
        await submitReleased;
        return res(ctx.status(200));
      }),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'PENDING' })),
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    });

    releaseSubmit();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
  });

  it('keeps both buttons disabled while the submitted application waits for its outcome', async () => {
    let releaseStatus = () => {};
    const statusReleased = new Promise<void>((resolve) => {
      releaseStatus = resolve;
    });
    let surveyPosts = 0;
    let statusRequests = 0;
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => {
        surveyPosts += 1;
        return res(ctx.status(200));
      }),
      rest.get(
        'http://localhost/v1/savings/onboarding/status/legal-entity',
        async (_req, res, ctx) => {
          statusRequests += 1;
          await statusReleased;
          return res(ctx.json({ status: 'PENDING' }));
        },
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(statusRequests).toBe(1);
    });
    expect(continueButton()).toBeDisabled();
    expect(backButton()).toBeDisabled();

    userEvent.click(continueButton());
    releaseStatus();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
    expect(surveyPosts).toBe(1);
  });

  it('does not navigate when the applicant has left the flow before the outcome arrives', async () => {
    let releaseStatus = () => {};
    const statusReleased = new Promise<void>((resolve) => {
      releaseStatus = resolve;
    });
    let statusRequests = 0;
    const history = createMemoryHistory();
    const queryClient = new QueryClient();
    const { unmount } = renderWrapped(
      <SavingsFundCompanyOnboarding />,
      history,
      undefined,
      queryClient,
    );
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get(
        'http://localhost/v1/savings/onboarding/status/legal-entity',
        async (_req, res, ctx) => {
          statusRequests += 1;
          await statusReleased;
          return res(ctx.json({ status: 'PENDING' }));
        },
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(statusRequests).toBe(1);
    });

    unmount();
    releaseStatus();

    await waitFor(() => {
      expect(queryClient.getQueryData(['savingsFundCompanyOnboardingStatus', '12345678'])).toEqual({
        status: 'PENDING',
      });
    });
    expect(history.location.pathname).toBe('/');
  });

  it('does not navigate when the applicant has left the flow while the account is switched', async () => {
    let releaseRoleSwitch = () => {};
    const roleSwitchReleased = new Promise<void>((resolve) => {
      releaseRoleSwitch = resolve;
    });
    let roleSwitches = 0;
    const history = createMemoryHistory();
    const queryClient = new QueryClient();
    const { unmount } = renderWrapped(
      <SavingsFundCompanyOnboarding />,
      history,
      undefined,
      queryClient,
    );
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
      rest.post('http://localhost/v1/me/role', async (_req, res, ctx) => {
        roleSwitches += 1;
        await roleSwitchReleased;
        return res(
          ctx.json({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' }),
        );
      }),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(roleSwitches).toBe(1);
    });

    unmount();
    releaseRoleSwitch();

    await waitFor(() => {
      expect(
        queryClient.getQueryData(['savingsFundCompanyOnboardingStatus', '12345678']),
      ).toBeUndefined();
    });
    expect(history.location.pathname).toBe('/');
  });

  it('does not navigate when the applicant has left the flow while the report is refreshed', async () => {
    const consoleError = jest.spyOn(console, 'error');
    let releaseRefreshedReport = () => {};
    const refreshedReportReleased = new Promise<void>((resolve) => {
      releaseRefreshedReport = resolve;
    });
    let reportRequests = 0;
    let refreshedReportDelivered = false;
    let statusRequests = 0;
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', async (_req, res, ctx) => {
        reportRequests += 1;
        if (reportRequests === 1) {
          return res(ctx.json(reportWithRelatedPersonErrors([USER_KYC_ERROR])));
        }
        await refreshedReportReleased;
        refreshedReportDelivered = true;
        return res(ctx.json(mockValidatedCompany));
      }),
    );
    const history = createMemoryHistory();
    const { unmount } = renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) => {
        statusRequests += 1;
        return res(ctx.json({ status: 'PENDING' }));
      }),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(reportRequests).toBe(2);
    });

    unmount();
    releaseRefreshedReport();

    await waitFor(() => {
      expect(refreshedReportDelivered).toBe(true);
    });
    expect(statusRequests).toBe(0);
    expect(history.location.pathname).toBe('/');
    expect(warningsAboutUnmountedUpdates(consoleError)).toEqual([]);
    consoleError.mockRestore();
  });

  it('does not update state when the outcome fails after the applicant has left the flow', async () => {
    const consoleError = jest.spyOn(console, 'error');
    let releaseStatus = () => {};
    const statusReleased = new Promise<void>((resolve) => {
      releaseStatus = resolve;
    });
    let statusRequests = 0;
    const history = createMemoryHistory();
    const { unmount } = renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get(
        'http://localhost/v1/savings/onboarding/status/legal-entity',
        async (_req, res, ctx) => {
          statusRequests += 1;
          await statusReleased;
          return res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' }));
        },
      ),
    );

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(statusRequests).toBe(1);
    });

    unmount();
    releaseStatus();

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledTimes(1);
    });
    expect(warningsAboutUnmountedUpdates(consoleError)).toEqual([]);
    consoleError.mockRestore();
  });

  it('acts on the freshly fetched status, not on one cached from an earlier submission', async () => {
    switchRoleBackend(server);
    const history = createMemoryHistory();
    const visitedPaths: string[] = [];
    history.listen((location) => visitedPaths.push(location.pathname));
    renderWrapped(
      <SavingsFundCompanyOnboarding />,
      history,
      undefined,
      clientHoldingAStaleStatus('PENDING'),
    );
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

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success/company');
    });
    expect(visitedPaths).toEqual(['/savings-fund/onboarding/success/company']);
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

  it('shows an error and offers a retry when the application outcome cannot be fetched', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' })),
      ),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/');
    expect(continueButton()).toBeEnabled();
  });

  it('checks the status again without screening the company twice when the applicant retries', async () => {
    let surveyPosts = 0;
    let statusRequests = 0;
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundCompanyOnboarding />, history);
    await selectCompany();
    await advanceToStep(2);
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => {
        surveyPosts += 1;
        return res(ctx.status(200));
      }),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) => {
        statusRequests += 1;
        if (statusRequests === 1) {
          return res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' }));
        }
        return res(ctx.json({ status: 'PENDING' }));
      }),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/waiting');
    });
    expect(surveyPosts).toBe(1);
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
    expect(continueButton()).toBeEnabled();

    userEvent.click(screen.getByRole('button', { name: 'Check again' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Check again' })).not.toBeInTheDocument();
    });
    expect(continueButton()).toBeEnabled();
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

  it('reports the identity submission failure to Sentry', async () => {
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
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('reports the company survey submission failure to Sentry', async () => {
    await navigateToStep2();
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' })),
      ),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('reports the role switch failure to Sentry and shows the error', async () => {
    await navigateToStep2();
    await completeStepsThroughTerms();

    server.use(
      rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
      rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
      rest.post('http://localhost/v1/me/role', (_req, res, ctx) => res(ctx.status(500))),
    );

    userEvent.click(continueButton());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('does not resubmit an unchanged identity when crossing back into the company steps', async () => {
    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    let identityPosts = 0;
    savingsFundOnboardingSurveyBackend(server, () => {
      identityPosts += 1;
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

    userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(
      await screen.findByRole('heading', {
        name: 'Are you a politically exposed person?',
        level: 2,
      }),
    ).toBeInTheDocument();
    userEvent.click(continueButton());

    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(identityPosts).toBe(1);
  });

  it('resubmits the identity when it was edited after the first submission', async () => {
    kycIdentityBackend(server, mockContactOnlyKycIdentity);
    const submittedEmails: (string | undefined)[] = [];
    savingsFundOnboardingSurveyBackend(server, (body) => {
      const emailAnswer = body.answers.find((answer) => answer.type === 'EMAIL') as
        | { type: string; value: { value: string } }
        | undefined;
      submittedEmails.push(emailAnswer?.value.value);
    });

    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(await screen.findByText('1/11')).toBeInTheDocument();

    await fillCitizenshipStep();
    await fillResidencyStep();
    await fillContactDetailsStepWith('first@example.com');
    await fillPepStep();
    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(
      await screen.findByRole('heading', {
        name: 'Are you a politically exposed person?',
        level: 2,
      }),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: /back/i }));

    await fillContactDetailsStepWith('changed@example.com');
    await fillPepStep();

    expect(
      await screen.findByRole('heading', { level: 2, name: "Enter your company's name" }),
    ).toBeInTheDocument();
    expect(submittedEmails).toEqual(['first@example.com', 'changed@example.com']);
  });
});

const OTHER_PERSONS_KYC_ERROR: ValidationError = {
  code: 'OTHER_RELATED_PERSONS_KYC',
  message: 'Isikusamasuse tuvastamine on lõpetamata',
};

const LONGER_THAN_ANY_REPORT_DEADLINE = 60000;

const USER_KYC_ERROR: ValidationError = {
  code: 'USER_KYC',
  message: 'Sinu isikusamasuse tuvastamine on lõpetamata',
};

const clientHoldingAStaleStatus = (status: SavingsFundOnboardingStatus['status']) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['savingsFundCompanyOnboardingStatus', '12345678'], { status });
  return queryClient;
};

const submitApplicationThatGoesPending = async (history: MemoryHistory) => {
  renderWrapped(<SavingsFundCompanyOnboarding />, history);
  await selectCompany();
  await advanceToStep(2);
  await completeStepsThroughTerms();

  server.use(
    rest.post('http://localhost/v1/kyb/surveys', (_req, res, ctx) => res(ctx.status(200))),
    rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
      res(ctx.json({ status: 'PENDING' })),
    ),
  );

  userEvent.click(continueButton());
};

const reportWithRelatedPersonErrors = (errors: ValidationError[]) => ({
  ...mockValidatedCompany,
  relatedPersons: { value: mockValidatedCompany.relatedPersons.value, errors },
});

const respondWithRelatedPersonErrors = (...errors: ValidationError[]) => {
  server.use(
    rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
      res(ctx.json(reportWithRelatedPersonErrors(errors))),
    ),
  );
};

const relatedPersonErrorsChangeWhileTheApplicantFillsTheForm = (
  atTheRequirementsStep: ValidationError[],
  byTheTimeTheApplicationIsSubmitted: ValidationError[],
) => {
  let reportRequests = 0;
  server.use(
    rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) => {
      reportRequests += 1;
      return res(
        ctx.json(
          reportWithRelatedPersonErrors(
            reportRequests === 1 ? atTheRequirementsStep : byTheTimeTheApplicationIsSubmitted,
          ),
        ),
      );
    }),
  );
};

const failToRefreshTheReportAfterTheRequirementsStep = (
  atTheRequirementsStep: ValidationError[],
) => {
  const reportRequests = { count: 0 };
  server.use(
    rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) => {
      reportRequests.count += 1;
      if (reportRequests.count === 1) {
        return res(ctx.json(reportWithRelatedPersonErrors(atTheRequirementsStep)));
      }
      return res(ctx.status(500), ctx.json({ error: 'INTERNAL_ERROR' }));
    }),
  );
  return reportRequests;
};

const completeTheOnboardingOnceTheReportIsRead = (stillOutstanding: ValidationError[]) => {
  const reportRequests = { count: 0 };
  let theOnboardingHasCompleted = false;
  server.use(
    rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) => {
      reportRequests.count += 1;
      if (reportRequests.count > 1) {
        theOnboardingHasCompleted = true;
      }
      return res(ctx.json(reportWithRelatedPersonErrors(stillOutstanding)));
    }),
    rest.get('http://localhost/v1/savings/onboarding/status/legal-entity', (_req, res, ctx) =>
      res(ctx.json({ status: theOnboardingHasCompleted ? 'COMPLETED' : 'PENDING' })),
    ),
  );
  return reportRequests;
};

type InterceptedRequest = XMLHttpRequest & { url: string };

const observeAbortedRequests = () => {
  const abortedRequestUrls: string[] = [];
  const interceptedRequests = window.XMLHttpRequest.prototype as InterceptedRequest;
  const abortRequest = interceptedRequests.abort;
  const observer = jest
    .spyOn(interceptedRequests, 'abort')
    .mockImplementation(function recordAbortedUrl(this: InterceptedRequest) {
      abortedRequestUrls.push(this.url);
      abortRequest.call(this);
    });
  return { abortedRequestUrls, stopObservingAbortedRequests: () => observer.mockRestore() };
};

const warningsAboutUnmountedUpdates = (consoleError: jest.SpyInstance) =>
  consoleError.mock.calls.filter(([message]) => String(message).includes('unmounted component'));

const continueButton = () => screen.getByRole('button', { name: /continue/i });

const backButton = () => screen.getByRole('button', { name: /back/i });

const fillContactDetailsStepWith = async (email: string) => {
  const emailInput = await screen.findByRole('textbox', { name: 'Email' });
  userEvent.clear(emailInput);
  userEvent.type(emailInput, email);
  userEvent.click(continueButton());
};

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

const waitForValidationReport = async () => {
  expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
};

// Advances from step 2 through to the terms step (7/7) without accepting the terms.
const advanceToTerms = async () => {
  await waitForValidationReport();
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
  await waitForValidationReport();
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
  await waitForValidationReport();
  await advanceToStep(3);
  await advanceToStep(4);
  userEvent.click(screen.getByRole('radio', { name: 'Long-term growth of company assets' }));
  await advanceToStep(5);
  userEvent.click(screen.getByRole('radio', { name: '€20,001–€40,000' }));
  await advanceToStep(6);
};
