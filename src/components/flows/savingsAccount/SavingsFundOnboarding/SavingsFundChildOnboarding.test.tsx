import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  createChildBackend,
  eligibleChildrenBackend,
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
const CHILD_CODE = '61506150006';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  userBackend(server);
  eligibleChildrenBackend(server);
  createChildBackend(server);
  savingsFundOnboardingSurveyBackend(server);
  switchRoleBackend(server);
  savingsFundOnboardingStatusBackend(server, 'COMPLETED');
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const continueButton = () => screen.getByRole('button', { name: /continue/i });

const verifyChild = async () => {
  const input = await screen.findByLabelText(/personal ID code/i);
  await waitFor(() => expect(input).toBeEnabled());
  userEvent.type(input, CHILD_CODE);
  userEvent.click(continueButton());
};

// From the confirm step (2/9) through to the terms step (9/9), leaving terms unticked.
const advanceToTerms = async () => {
  expect(await screen.findByText('2/9')).toBeInTheDocument(); // confirm
  userEvent.click(continueButton());

  expect(await screen.findByText('3/9')).toBeInTheDocument(); // residency (prefilled)
  userEvent.click(continueButton());

  expect(await screen.findByText('4/9')).toBeInTheDocument(); // contact (prefilled)
  userEvent.click(continueButton());

  expect(await screen.findByText('5/9')).toBeInTheDocument(); // goal (multi-select)
  userEvent.click(screen.getByRole('checkbox', { name: /Education/ }));
  userEvent.click(continueButton());

  expect(await screen.findByText('6/9')).toBeInTheDocument(); // contribution
  userEvent.click(screen.getByRole('radio', { name: /200–600/ }));
  userEvent.click(continueButton());

  expect(await screen.findByText('7/9')).toBeInTheDocument(); // investable assets
  userEvent.click(screen.getByRole('radio', { name: /Up to 2000/ }));
  userEvent.click(continueButton());

  expect(await screen.findByText('8/9')).toBeInTheDocument(); // funding
  userEvent.click(screen.getByRole('checkbox', { name: /parent.*income/i }));
  userEvent.click(continueButton());

  expect(await screen.findByText('9/9')).toBeInTheDocument(); // terms
};

describe('SavingsFundChildOnboarding', () => {
  it('starts by asking for the child personal ID code', async () => {
    renderWrapped(<SavingsFundChildOnboarding />);

    expect(await screen.findByText('1/9')).toBeInTheDocument();
    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
  });

  it('pre-selects the child passed via router state (co-parent from the account switcher)', async () => {
    eligibleChildrenBackend(server, [
      { personalCode: CHILD_CODE, firstName: 'Mammu', lastName: 'Maasikas' },
    ]);
    const history = createMemoryHistory({
      initialEntries: [
        { pathname: '/savings-fund/onboarding/child', state: { childPersonalCode: CHILD_CODE } },
      ],
    });
    renderWrapped(<SavingsFundChildOnboarding />, history);

    expect(await screen.findByRole('combobox', { name: /personal ID code/i })).toHaveValue(
      CHILD_CODE,
    );
  });

  it('skips the confirm step when a child is picked from the dropdown', async () => {
    eligibleChildrenBackend(server, [
      { personalCode: CHILD_CODE, firstName: 'Mammu', lastName: 'Maasikas' },
    ]);
    renderWrapped(<SavingsFundChildOnboarding />);

    // With a dropdown available the confirm step is dropped, so the flow is 8 steps.
    expect(await screen.findByText('1/8')).toBeInTheDocument();
    userEvent.selectOptions(
      await screen.findByRole('combobox', { name: /personal ID code/i }),
      CHILD_CODE,
    );
    userEvent.click(continueButton());

    // Straight to residency — no separate card restating the child's details.
    expect(await screen.findByText('2/8')).toBeInTheDocument();
    expect(screen.queryByText(/Mammu Maasikas/)).not.toBeInTheDocument();
  });

  it('confirms a manually entered child from the population register when custody is verified', async () => {
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();

    expect(await screen.findByText(/Mammu Maasikas/)).toBeInTheDocument();
    expect(screen.getByText(/07\.09\.2015/)).toBeInTheDocument();
  });

  it('shows the check-the-code message (no name, stays on the step) when custody is not verified', async () => {
    createChildBackend(server, { status: 'UNDER_REVIEW' });
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();

    expect(await screen.findByRole('alert')).toHaveTextContent(/check the personal ID code/i);
    // The child's name is never revealed, and the parent can fix the code in place.
    expect(screen.queryByText(/Mammu/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
  });

  it('shows the same check-the-code message when the backend rejects the code as invalid', async () => {
    server.use(
      rest.post('http://localhost/v1/me/children', (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'INVALID_PERSONAL_CODE' }] })),
      ),
    );
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();

    expect(await screen.findByRole('alert')).toHaveTextContent(/check the personal ID code/i);
    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
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

  it('prefills the parent contact as the default channel on the contact step', async () => {
    renderWrapped(<SavingsFundChildOnboarding />);

    await verifyChild();
    expect(await screen.findByText('2/9')).toBeInTheDocument(); // confirm
    userEvent.click(continueButton());
    expect(await screen.findByText('3/9')).toBeInTheDocument(); // residency
    userEvent.click(continueButton());
    expect(await screen.findByText('4/9')).toBeInTheDocument(); // contact

    expect(screen.getByLabelText(/email/i)).toHaveValue(mockUser.email);
  });

  it('completes as the child and lands on the success page', async () => {
    const history = createMemoryHistory();
    renderWrapped(<SavingsFundChildOnboarding />, history);

    await verifyChild();
    await advanceToTerms();
    userEvent.click(screen.getByRole('checkbox', { name: /legal representative/i }));
    userEvent.click(continueButton());

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding/success/child');
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
