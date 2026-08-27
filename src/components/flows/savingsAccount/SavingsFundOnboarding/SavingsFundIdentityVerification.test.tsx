import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('tells the person their part is done and the account still needs the application submitted', async () => {
    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the company account opens automatically once the company's application has been submitted and everyone connected to the company has verified their identity/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('does not walk an already verified person through an empty flow', async () => {
    kycIdentityBackend(server, mockCompleteKycIdentity);

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(
      await screen.findByRole('heading', { name: 'Your identity is already verified' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the company account opens automatically once the company's application has been submitted and everyone connected to the company has verified their identity/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('1/4')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  const doubleClickContinue = async () => {
    const button = await screen.findByRole('button', { name: 'Continue' });
    userEvent.click(button);
    userEvent.click(button);
  };

  it('does not skip an unvalidated step when Continue is double-clicked', async () => {
    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await fillCitizenshipStep();

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

    await doubleClickContinue();

    expect(
      await screen.findByRole('heading', { name: 'Your contact details', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('submits once when Continue is double-clicked on the last step', async () => {
    let posts = 0;
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (_req, res, ctx) => {
        posts += 1;
        return res(ctx.delay(50), ctx.status(200));
      }),
    );

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await fillCitizenshipStep();
    await fillResidencyStep();
    await fillContactDetailsStep();

    expect(
      await screen.findByRole('heading', {
        name: 'Are you a politically exposed person?',
        level: 2,
      }),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: 'I am not a politically exposed person' }));

    await doubleClickContinue();

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();
    expect(posts).toBe(1);
  });

  it('does not let the person walk back while the answers are in flight', async () => {
    let releaseSubmit = () => {};
    const submitReleased = new Promise<void>((resolve) => {
      releaseSubmit = resolve;
    });
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', async (_req, res, ctx) => {
        await submitReleased;
        return res(ctx.status(200));
      }),
    );

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    });

    releaseSubmit();

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();
  });

  it('surfaces a submit failure instead of claiming the verification is done', async () => {
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (_req, res, ctx) => res(ctx.status(500))),
    );

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There was an error while submitting your details.',
    );
    expect(
      screen.queryByRole('heading', { name: 'Identity verification complete' }),
    ).not.toBeInTheDocument();
  });

  it('lets the person submit again after a failed submit', async () => {
    let posts = 0;
    server.use(
      rest.post('http://localhost/v1/kyc/surveys', (_req, res, ctx) => {
        posts += 1;
        return res(ctx.status(posts === 1 ? 500 : 200));
      }),
    );

    renderWrapped(<SavingsFundIdentityVerification />);

    expect(await screen.findByText('1/4')).toBeInTheDocument();
    await completeIdentitySteps();

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByRole('heading', { name: 'Identity verification complete' }),
    ).toBeInTheDocument();
    expect(posts).toBe(2);
  });
});
