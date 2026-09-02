import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/browser';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { useTestBackendsExcept } from '../../test/backend';
import { mockUser } from '../../test/backend-responses';
import { Role, SwitchRoleCommand } from '../common/apiModels';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

const server = setupServer();

let history: MemoryHistory;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store, queryClient);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const personRole = mockUser.role;
const acmeRole: Role = {
  type: 'LEGAL_ENTITY',
  code: '11111111',
  name: 'Acme OÜ',
  id: '11111111-1111-1111-1111-111111111111',
};
const betaRole: Role = {
  type: 'LEGAL_ENTITY',
  code: '22222222',
  name: 'Beta OÜ',
  id: '22222222-2222-2222-2222-222222222222',
};
const childRole: Role = {
  type: 'PERSON',
  code: '61506150006',
  name: 'Child Name',
  id: '33333333-3333-3333-3333-333333333333',
};
const secondChildRole: Role = {
  type: 'PERSON',
  code: '61506150007',
  name: 'Second Child',
  id: '44444444-4444-4444-4444-444444444444',
};

function roleSessionBackend(roles: Role[], initialRole: Role) {
  const session = { role: initialRole, switchedRole: null as SwitchRoleCommand | null };

  server.use(
    rest.get('http://localhost/v1/me', (_req, res, ctx) =>
      res(ctx.json({ ...mockUser, role: session.role })),
    ),
    rest.get('http://localhost/v1/me/roles', (_req, res, ctx) => res(ctx.json(roles))),
    rest.post('http://localhost/v1/me/role', (req, res, ctx) => {
      const command = req.body as SwitchRoleCommand;
      session.switchedRole = command;
      const target = roles.find(({ type, code }) => type === command.type && code === command.code);
      if (target) {
        session.role = target;
      }
      return res(
        ctx.json({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' }),
      );
    }),
  );

  return session;
}

function holdRoleSwitch(session: { role: Role }, target: Role) {
  let release: () => void = () => undefined;
  let markRequested: () => void = () => undefined;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });

  server.use(
    rest.post('http://localhost/v1/me/role', async (_req, res, ctx) => {
      markRequested();
      await held;
      // eslint-disable-next-line no-param-reassign
      session.role = target;
      return res(
        ctx.json({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' }),
      );
    }),
  );

  return { requested, release: () => release() };
}

function holdFirstRoleSwitch(
  session: { role: Role; switchedRole: SwitchRoleCommand | null },
  roles: Role[],
) {
  let markRequested: () => void = () => undefined;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstSwitch = true;

  server.use(
    rest.post('http://localhost/v1/me/role', async (req, res, ctx) => {
      if (firstSwitch) {
        firstSwitch = false;
        markRequested();
        await held;
      }
      const command = req.body as SwitchRoleCommand;
      const target = roles.find(({ type, code }) => type === command.type && code === command.code);
      /* eslint-disable no-param-reassign */
      session.switchedRole = command;
      if (target) {
        session.role = target;
      }
      /* eslint-enable no-param-reassign */
      return res(
        ctx.json({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' }),
      );
    }),
  );

  return { requested, release: () => release() };
}

function initializeWithRoles(roles: Role[], initialRole: Role) {
  initializeConfiguration();
  useTestBackendsExcept(server, ['user', 'roles']);
  const session = roleSessionBackend(roles, initialRole);
  initializeComponent();
  return session;
}

const representedPartyAccount = () =>
  screen.findByRole('region', { name: 'represented-party-account' });

const accountSwitcherFor = (name: RegExp) => screen.findByRole('button', { name });

describe('/account/company', () => {
  test('switches to the company role and renders its account', async () => {
    const session = initializeWithRoles([personRole, acmeRole], personRole);

    history.push('/account/company');

    expect(await representedPartyAccount()).toBeInTheDocument();
    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
    expect(session.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '11111111' });
  });

  test('picks the same company whatever order the server returns them in', async () => {
    const session = initializeWithRoles([personRole, betaRole, acmeRole], personRole);

    history.push('/account/company');

    expect(await representedPartyAccount()).toBeInTheDocument();
    expect(session.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '11111111' });
  });

  test('lands on the plain account path, leaving no deep link in history', async () => {
    initializeWithRoles([personRole, acmeRole], personRole);

    history.push('/account/company');

    expect(await representedPartyAccount()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/account');
    expect(history.entries.map(({ pathname }) => pathname)).not.toContain('/account/company');
  });

  test('does not switch again when already acting as the company', async () => {
    const session = initializeWithRoles([personRole, acmeRole], acmeRole);

    history.push('/account/company');

    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
    expect(session.switchedRole).toBeNull();
  });

  test('falls back to the own account when the member represents no company', async () => {
    const session = initializeWithRoles([personRole, childRole], personRole);

    history.push('/account/company');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(session.switchedRole).toBeNull();
    expect(history.location.pathname).toBe('/account');
  });
});

describe('/account/child', () => {
  test('switches to the child role and renders its account', async () => {
    const session = initializeWithRoles([personRole, childRole], personRole);

    history.push('/account/child');

    expect(await representedPartyAccount()).toBeInTheDocument();
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: '61506150006' });
  });

  test('picks the same child whatever order the server returns them in', async () => {
    const session = initializeWithRoles([personRole, secondChildRole, childRole], personRole);

    history.push('/account/child');

    expect(await representedPartyAccount()).toBeInTheDocument();
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: '61506150006' });
  });

  test('lands on the own account when the backend refuses the role switch', async () => {
    initializeWithRoles([personRole, childRole], personRole);
    server.use(rest.post('http://localhost/v1/me/role', (_req, res, ctx) => res(ctx.status(403))));

    history.push('/account/child');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/account');
    expect(captureException).toHaveBeenCalled();
  });

  test('falls back to the own account when the roles lookup fails', async () => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['roles']);
    server.use(rest.get('http://localhost/v1/me/roles', (_req, res, ctx) => res(ctx.status(500))));
    initializeComponent();

    history.push('/account/child');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/account');
  });

  test('finishes the switch but abandons the redirect once the member has navigated away', async () => {
    const session = initializeWithRoles([personRole, childRole], personRole);
    const { requested, release } = holdRoleSwitch(session, childRole);

    history.push('/account/child');
    await requested;
    history.push('/somewhere-else');
    release();

    expect(await accountSwitcherFor(/Child Name/)).toBeInTheDocument();
    expect(history.location.pathname).toBe('/somewhere-else');
  });

  test('does not mistake the own person role for a child', async () => {
    const session = initializeWithRoles([personRole, acmeRole], personRole);

    history.push('/account/child');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(session.switchedRole).toBeNull();
  });
});

describe('/savings-fund/payment/child', () => {
  test('switches to the child role and lands on the payment page', async () => {
    const session = initializeWithRoles([personRole, childRole], personRole);

    history.push('/savings-fund/payment/child');

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: '61506150006' });
    expect(history.entries.map(({ pathname }) => pathname)).not.toContain(
      '/savings-fund/payment/child',
    );
  });
});

describe('/savings-fund/payment/company', () => {
  test('switches to the company role and lands on the payment page', async () => {
    const session = initializeWithRoles([personRole, acmeRole], personRole);

    history.push('/savings-fund/payment/company');

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: '11111111' });
  });

  test('lands on the payment page without switching when already acting as the company', async () => {
    const session = initializeWithRoles([personRole, acmeRole], acmeRole);

    history.push('/savings-fund/payment/company');

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toBeNull();
  });
});

describe('a payment deep link that names the account', () => {
  test('switches to the named child even when another child sorts first', async () => {
    const session = initializeWithRoles([personRole, childRole, secondChildRole], personRole);

    history.push(`/savings-fund/payment/child/${secondChildRole.id}`);

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: secondChildRole.code });
  });

  test('switches to the named company even when another company sorts first', async () => {
    const session = initializeWithRoles([personRole, acmeRole, betaRole], personRole);

    history.push(`/savings-fund/payment/company/${betaRole.id}`);

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'LEGAL_ENTITY', code: betaRole.code });
  });

  test('falls back to the first account of that kind when the id is no longer known', async () => {
    const session = initializeWithRoles([personRole, childRole, secondChildRole], personRole);

    history.push('/savings-fund/payment/child/99999999-9999-9999-9999-999999999999');

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: childRole.code });
  });
});

describe('a payment deep link opened while acting as another account of the same kind', () => {
  test('switches from one child to the child the link names', async () => {
    const session = initializeWithRoles([personRole, childRole, secondChildRole], childRole);

    history.push(`/savings-fund/payment/child/${secondChildRole.id}`);

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toEqual({ type: 'PERSON', code: secondChildRole.code });
  });

  test('does not switch when already acting as the child the link names', async () => {
    const session = initializeWithRoles([personRole, childRole, secondChildRole], secondChildRole);

    history.push(`/savings-fund/payment/child/${secondChildRole.id}`);

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(session.switchedRole).toBeNull();
  });
});

describe('a payment deep link that cannot reach the account it was opened for', () => {
  test('stays on the account page when the member represents no child', async () => {
    const session = initializeWithRoles([personRole], personRole);

    history.push('/savings-fund/payment/child');

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
    expect(session.switchedRole).toBeNull();
  });

  test('stays on the account page when the role switch fails', async () => {
    const session = initializeWithRoles([personRole, childRole], personRole);
    server.use(rest.post('http://localhost/v1/me/role', (_req, res, ctx) => res(ctx.status(500))));

    history.push('/savings-fund/payment/child');

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
    expect(session.role).toEqual(personRole);
  });

  test('carries the payment options through to the payment page', async () => {
    initializeWithRoles([personRole, childRole], personRole);

    history.push('/savings-fund/payment/child?type=RECURRING');

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
    expect(history.location.search).toBe('?type=RECURRING');
  });

  test('opens the destination the member asked for last for the same holder', async () => {
    const roles = [personRole, acmeRole];
    const session = initializeWithRoles(roles, personRole);
    const { requested, release } = holdFirstRoleSwitch(session, roles);

    history.push('/account/company');
    await requested;
    history.push('/savings-fund/payment/company');
    release();

    await waitFor(() => expect(history.location.pathname).toBe('/savings-fund/payment'));
  });
});

describe('a second deep link opened while the first is still resolving', () => {
  const roles = [personRole, acmeRole, childRole];

  test('opens the account the member asked for last', async () => {
    const session = initializeWithRoles(roles, personRole);
    const { requested, release } = holdFirstRoleSwitch(session, roles);

    history.push('/account/company');
    await requested;
    history.push('/account/child');
    release();

    expect(await accountSwitcherFor(/Child Name/)).toBeInTheDocument();
    expect(session.role).toEqual(childRole);
  });

  test('does not let the abandoned deep link redirect on top of the newer one', async () => {
    const session = initializeWithRoles(roles, personRole);
    const { requested, release } = holdFirstRoleSwitch(session, roles);

    history.push('/account/company');
    await requested;
    history.push('/account/child');
    release();

    expect(await accountSwitcherFor(/Child Name/)).toBeInTheDocument();
    expect(history.location.pathname).toBe('/account');
    expect(history.entries.map(({ pathname }) => pathname)).not.toContain('/account/child');
  });
});
