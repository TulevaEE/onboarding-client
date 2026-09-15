import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  rolesBackend,
  switchRoleBackend,
  transactionsBackend,
  useTestBackends,
  nudgeBackend,
  useTestBackendsExcept,
  userBackend,
} from '../../test/backend';
import { mockUser } from '../../test/backend-responses';
import { contribution } from './TransactionSection/fixtures';

const server = setupServer();

let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('when user has PERSON role', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    initializeComponent();
    history.push('/account');
  });

  test('renders the person account page', async () => {
    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
  });
});

describe('when user has LEGAL_ENTITY role', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    initializeComponent();
    history.push('/account');
  });

  test('does not render the person account page', async () => {
    expect(screen.queryByText('Hi, John Doe')).not.toBeInTheDocument();
  });

  test('renders the represented party account page', async () => {
    expect(
      await screen.findByRole('region', { name: 'represented-party-account' }),
    ).toBeInTheDocument();
  });
});

describe('when user represents a child (PERSON role with a different code)', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      personalCode: '38812121215',
      role: { type: 'PERSON', code: '61506150006', name: 'Child Name' },
    });
    initializeComponent();
    history.push('/account');
  });

  test('renders the savings-only represented party account page', async () => {
    expect(
      await screen.findByRole('region', { name: 'represented-party-account' }),
    ).toBeInTheDocument();
  });

  test('does not render the full person account page greeting', async () => {
    expect(
      await screen.findByRole('region', { name: 'represented-party-account' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Hi, John Doe')).not.toBeInTheDocument();
  });

  test('does not render pillar II/III change-fund action links', async () => {
    expect(
      await screen.findByRole('region', { name: 'represented-party-account' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Change II\spillar fund/i })).not.toBeInTheDocument();
  });
});

const personRole = mockUser.role;
const acmeRole = { type: 'LEGAL_ENTITY' as const, code: '11111111', name: 'Acme OÜ' };
const betaRole = { type: 'LEGAL_ENTITY' as const, code: '22222222', name: 'Beta OÜ' };

// A role switch refetches everything. React Query serves the previous role's data
// while the refetch is in flight, so without a guard the account page would flash
// the old role's values. These tests hold the new /v1/me response open to make that
// refresh window observable and assert a shimmer renders instead of stale values.
// Note: a role switch hits /v1/me twice — React Query's useMe refetch and the redux
// onGetUser thunk — so this persistent handler (not .once()) gates both on one promise.
function holdNextUserResponse(role: typeof personRole): () => void {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    rest.get('http://localhost/v1/me', async (_req, res, ctx) => {
      await held;
      return res(ctx.json({ ...mockUser, role }));
    }),
  );
  return release;
}

function clickRoleInSwitcher(currentName: RegExp, targetName: string): void {
  userEvent.click(screen.getByRole('button', { name: currentName }));
  const targetItem = screen
    .getAllByRole('button')
    .find((button) => button.textContent === targetName) as HTMLElement;
  userEvent.click(targetItem);
}

describe('when switching from a personal role to a company role', () => {
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, { role: personRole });
    transactionsBackend(server, [contribution]);
    rolesBackend(server, [personRole, acmeRole]);
    switchRoleBackend(server);
    initializeComponent();
    history.push('/account');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(await screen.findByText(/313[.,]57/)).toBeInTheDocument();
  });

  test('shows a shimmer and hides the personal role values while refreshing', async () => {
    holdNextUserResponse(acmeRole);

    clickRoleInSwitcher(/John Doe/i, 'Acme OÜ');

    expect(await screen.findByTestId('account-page-loader')).toBeInTheDocument();
    expect(screen.queryByText('Hi, John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText(/313[.,]57/)).not.toBeInTheDocument();
  });

  test('renders the company account page once the refresh resolves', async () => {
    const release = holdNextUserResponse(acmeRole);

    clickRoleInSwitcher(/John Doe/i, 'Acme OÜ');
    expect(await screen.findByTestId('account-page-loader')).toBeInTheDocument();

    release();

    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
    expect(screen.queryByText('Hi, John Doe')).not.toBeInTheDocument();
  });
});

describe('when switching from one company role to another', () => {
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, { role: acmeRole });
    rolesBackend(server, [personRole, acmeRole, betaRole]);
    switchRoleBackend(server);
    initializeComponent();
    history.push('/account');

    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
  });

  test('shows a shimmer and hides the previous company values while refreshing', async () => {
    holdNextUserResponse(betaRole);

    clickRoleInSwitcher(/Acme OÜ/i, 'Beta OÜ');

    expect(await screen.findByTestId('account-page-loader')).toBeInTheDocument();
    expect(screen.queryByText('Hi, Acme OÜ representative')).not.toBeInTheDocument();
  });

  test('renders the new company account page once the refresh resolves', async () => {
    const release = holdNextUserResponse(betaRole);

    clickRoleInSwitcher(/Acme OÜ/i, 'Beta OÜ');
    expect(await screen.findByTestId('account-page-loader')).toBeInTheDocument();

    release();

    expect(await screen.findByText('Hi, Beta OÜ representative')).toBeInTheDocument();
    expect(screen.queryByText('Hi, Acme OÜ representative')).not.toBeInTheDocument();
  });
});

const paymentRateSeason = {
  deadline: '2026-11-30',
  fulfillmentDate: '2027-01-01',
  mode: 'SEASON' as const,
};

describe('when the payment rate season is on and the payment rate nudge wins', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['nudge']);
    nudgeBackend(server, {
      key: 'SECOND_PILLAR_PAYMENT_RATE',
      tag: 'nudge_payment_rate',
      paymentRateSeason,
    });
    initializeComponent();
    history.push('/account');
  });

  test('renders the second pillar row with the season pill and the deadline', async () => {
    expect(await screen.findByText(/Now 2% →/)).toHaveTextContent('Now 2% → up to 6%');
    expect(
      screen.getByText(
        /From January\s1 you can contribute up to 6% straight from your gross salary/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/application deadline is November\s30/)).toBeInTheDocument();
  });

  test('highlights the second pillar row and outlines every other action', async () => {
    expect(await screen.findByText(/Now 2% →/)).toHaveTextContent('Now 2% → up to 6%');
    const rows = screen.getAllByTestId('status-box-row');

    expect(rows[0]).toHaveClass('primary');
    expect(rows.slice(1).every((row) => row.classList.contains('secondary'))).toBe(true);

    const filledActions = rows.flatMap((row) =>
      within(row)
        .queryAllByRole('link')
        .filter((link) => link.classList.contains('btn-primary')),
    );

    expect(filledActions.length).toBe(1);
    expect(filledActions[0]).toHaveTextContent('Increase contribution');
  });
});

describe('when the payment rate season is on and another nudge wins', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['nudge', 'user']);
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    nudgeBackend(server, {
      key: 'THIRD_PILLAR_START',
      tag: 'nudge_third_pillar',
      paymentRateSeason,
    });
    initializeComponent();
    history.push('/account');
  });

  test('renders the second pillar season support copy', async () => {
    expect(
      await screen.findByText(/You contribute the maximum to II\spillar, 6% of your gross salary/),
    ).toBeInTheDocument();
  });

  test('demotes no row', async () => {
    expect(
      await screen.findByText(/You contribute the maximum to II\spillar, 6% of your gross salary/),
    ).toBeInTheDocument();
    const rows = screen.getAllByTestId('status-box-row');

    expect(rows.some((row) => row.classList.contains('primary'))).toBe(false);
    expect(rows.some((row) => row.classList.contains('secondary'))).toBe(false);
  });
});
