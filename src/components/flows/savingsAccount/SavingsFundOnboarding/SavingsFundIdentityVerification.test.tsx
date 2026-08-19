import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  kycIdentityBackend,
  savingsFundOnboardingSurveyBackend,
  userBackend,
} from '../../../../test/backend';
import {
  mockCompleteKycIdentity,
  mockContactOnlyKycIdentity,
} from '../../../../test/backend-responses';
import { initializeConfiguration } from '../../../config/config';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundIdentityVerification } from './SavingsFundIdentityVerification';
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
  userBackend(server);
  kycIdentityBackend(server, mockContactOnlyKycIdentity);
  savingsFundOnboardingSurveyBackend(server);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const completeIdentitySteps = async () => {
  await fillCitizenshipStep();
  await fillResidencyStep();
  await fillContactDetailsStep();
  await fillPepStep();
};

describe('SavingsFundIdentityVerification', () => {
  it('collects only the four identity steps', async () => {
    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Identity verification', level: 1 }),
    ).toBeInTheDocument();
  });

  it('submits the identity as IDENTITY_ONLY, without any onboarding profile answers', async () => {
    let captured: { purpose?: string; answers: { type: string }[] } | null = null;
    savingsFundOnboardingSurveyBackend(server, (body) => {
      captured = body;
    });

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();

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
    expect(types).not.toContain('INVESTABLE_ASSETS');
    expect(types).not.toContain('SOURCE_OF_INCOME');
    expect(types).not.toContain('TERMS');
  });

  it('tells the person their part is done and someone else continues the application', async () => {
    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/whoever started the company's application can now continue it/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('does not walk an already verified person through an empty flow', async () => {
    kycIdentityBackend(server, mockCompleteKycIdentity);

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(
      await screen.findByRole('heading', { name: 'Your identity is already verified' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('1/4')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('surfaces a submit failure instead of claiming the verification is done', async () => {
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (_req, res, ctx) => res(ctx.status(500))),
    );

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Identity verification complete' }),
    ).not.toBeInTheDocument();
  });
});
