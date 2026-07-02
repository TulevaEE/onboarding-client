import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { setupServer } from 'msw/node';
import {
  createChildBackend,
  savingsFundOnboardingStatusBackend,
  savingsFundOnboardingSurveyBackend,
  switchRoleBackend,
  userBackend,
} from '../../../../test/backend';
import { mockUser } from '../../../../test/backend-responses';
import { initializeConfiguration } from '../../../config/config';
import { renderWrapped } from '../../../../test/utils';
import { mockInAadress } from '../../../../test/identityStepFills';
import { SavingsFundChildOnboarding } from './SavingsFundChildOnboarding';

mockInAadress();

const server = setupServer();
const CHILD_CODE = '61509070000';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  userBackend(server);
  createChildBackend(server);
  savingsFundOnboardingSurveyBackend(server);
  switchRoleBackend(server);
  savingsFundOnboardingStatusBackend(server, 'COMPLETED');
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const continueButton = () => screen.getByRole('button', { name: /continue/i });

const verifyChild = async () => {
  userEvent.type(await screen.findByLabelText(/personal ID code/i), CHILD_CODE);
  userEvent.click(continueButton());
};

// From the confirm step (2/8) through to the terms step (8/8), leaving terms unticked.
const advanceToTerms = async () => {
  expect(await screen.findByText('2/8')).toBeInTheDocument(); // confirm
  userEvent.click(continueButton());

  expect(await screen.findByText('3/8')).toBeInTheDocument(); // residency (prefilled)
  userEvent.click(continueButton());

  expect(await screen.findByText('4/8')).toBeInTheDocument(); // contact (prefilled)
  userEvent.click(continueButton());

  expect(await screen.findByText('5/8')).toBeInTheDocument(); // goal
  userEvent.click(screen.getByRole('radio', { name: /Education/ }));
  userEvent.click(continueButton());

  expect(await screen.findByText('6/8')).toBeInTheDocument(); // contribution
  userEvent.click(screen.getByRole('radio', { name: /50–100/ }));
  userEvent.click(continueButton());

  expect(await screen.findByText('7/8')).toBeInTheDocument(); // funding
  userEvent.click(screen.getByRole('checkbox', { name: /parent.*income/i }));
  userEvent.click(continueButton());

  expect(await screen.findByText('8/8')).toBeInTheDocument(); // terms
};

describe('SavingsFundChildOnboarding', () => {
  it('starts by asking for the child personal ID code', async () => {
    renderWrapped(<SavingsFundChildOnboarding />);

    expect(await screen.findByText('1/8')).toBeInTheDocument();
    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
  });

  it('confirms the child from the population register when custody is verified', async () => {
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();

    expect(await screen.findByText(/Mammu Maasikas/)).toBeInTheDocument();
    expect(screen.getByText(/07\.09\.2015/)).toBeInTheDocument();
  });

  it('shows the review screen (no name) when custody is not verified', async () => {
    createChildBackend(server, { status: 'UNDER_REVIEW' });
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();

    expect(await screen.findByRole('heading', { name: /review/i })).toBeInTheDocument();
    expect(screen.queryByText(/Mammu/)).not.toBeInTheDocument();
  });

  it('does not switch role until the final submit, then switches to the child once', async () => {
    const switchBackend = switchRoleBackend(server);
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();
    await advanceToTerms();

    // No role switch anywhere in the identity / KYC steps.
    expect(switchBackend.switchedRole).toBeNull();

    userEvent.click(screen.getByRole('checkbox', { name: /legal representative/i }));
    userEvent.click(continueButton());

    await waitFor(() => {
      expect(switchBackend.switchedRole).toEqual({ type: 'PERSON', code: CHILD_CODE });
    });
  });

  it('completes as the child and lands on the success page', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundChildOnboarding />, history);

    await verifyChild();
    await advanceToTerms();
    userEvent.click(screen.getByRole('checkbox', { name: /legal representative/i }));
    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success');
    });
  });

  it('rolls back to the parent role and shows the pending page when not completed', async () => {
    savingsFundOnboardingStatusBackend(server, 'PENDING');
    const switchBackend = switchRoleBackend(server);
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundChildOnboarding />, history);

    await verifyChild();
    await advanceToTerms();
    userEvent.click(screen.getByRole('checkbox', { name: /legal representative/i }));
    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/pending');
    });
    // Rolled back: the last switch returned the parent to their own role.
    expect(switchBackend.switchedRole).toEqual({ type: 'PERSON', code: mockUser.personalCode });
  });

  it('submits the child KYC without citizenship or PEP items', async () => {
    let body: { answers: { type: string }[] } | null = null;
    savingsFundOnboardingSurveyBackend(server, (captured) => {
      body = captured;
    });
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();
    await advanceToTerms();
    userEvent.click(screen.getByRole('checkbox', { name: /legal representative/i }));
    userEvent.click(continueButton());

    await waitFor(() => {
      expect(body).not.toBeNull();
    });
    const types = (body as unknown as { answers: { type: string }[] }).answers.map((a) => a.type);
    expect(types).toContain('FUNDING_SOURCES');
    expect(types).not.toContain('CITIZENSHIP');
    expect(types).not.toContain('PEP_SELF_DECLARATION');
  });

  it('goes back to the previous page when Back is clicked on the first step', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/savings-fund/onboarding', '/savings-fund/onboarding/child'],
      initialIndex: 1,
    });
    renderWrapped(<SavingsFundChildOnboarding />, history);

    userEvent.click(await screen.findByRole('button', { name: /back/i }));

    expect(history.location.pathname).toBe('/savings-fund/onboarding');
  });
});
