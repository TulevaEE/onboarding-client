import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  applicationsBackend,
  rejoinPermissionBackend,
  userBackend,
  useTestBackends,
} from '../../../test/backend';
import { rejoin } from '../../account/ApplicationSection/fixtures';
import LoggedInApp from '../../LoggedInApp';

describe('When someone who stopped contributing opens a II pillar flow', () => {
  const server = setupServer();
  let history: History;
  let permissionRequests: number;

  const render = (path: string) => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(
      <Route path="" component={LoggedInApp} />,
      history as any,
      store,
      new QueryClient(),
    );
    history.push(path);
  };

  const rejoinHeading = () =>
    screen.findByRole('heading', { name: 'Save in the II pillar again and win on taxes' });
  const secondPillarFlowStart = () => screen.findByText(/Your pension account overview/i);
  const paymentRateFlowStart = () => screen.findByText('Increase your II pillar tax benefits');

  const stoppedContributing = () =>
    userBackend(server, {
      secondPillarContributions: {
        contributing: false,
        restartDate: null,
        rejoinPossibleFrom: null,
      },
    });
  const pensionikeskusSays = (permitted: boolean) => {
    rejoinPermissionBackend(server, { permitted });
    server.use(
      rest.get('http://localhost/v1/rejoin-permission', (req, res, ctx) => {
        permissionRequests += 1;
        return res(ctx.status(200), ctx.json({ permitted }));
      }),
    );
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    permissionRequests = 0;
  });

  test('sends someone who may rejoin from the fund flow to the rejoin page', async () => {
    stoppedContributing();
    pensionikeskusSays(true);

    render('/2nd-pillar-flow');

    expect(await rejoinHeading()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/2nd-pillar-rejoin');
  });

  test('sends someone who may rejoin from the payment rate flow to the rejoin page', async () => {
    stoppedContributing();
    pensionikeskusSays(true);

    render('/2nd-pillar-payment-rate');

    expect(await rejoinHeading()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/2nd-pillar-rejoin');
  });

  test('keeps the language in the address when sending someone to the rejoin page', async () => {
    stoppedContributing();
    pensionikeskusSays(true);

    render('/2nd-pillar-flow?language=en');

    expect(await rejoinHeading()).toBeInTheDocument();
    expect(history.location.search).toBe('?language=en');
  });

  test('lets someone who may not rejoin yet change their fund', async () => {
    stoppedContributing();
    pensionikeskusSays(false);

    render('/2nd-pillar-flow');

    expect(await secondPillarFlowStart()).toBeInTheDocument();
    expect(history.location.pathname).toMatch(/^\/2nd-pillar-flow\//);
  });

  test('lets someone who already applied to rejoin change their payment rate', async () => {
    stoppedContributing();
    pensionikeskusSays(true);
    applicationsBackend(server, [rejoin]);

    render('/2nd-pillar-payment-rate');

    expect(await paymentRateFlowStart()).toBeInTheDocument();
    expect(history.location.pathname).toBe('/2nd-pillar-payment-rate');
  });

  test('lets someone whose contributions restart change their fund', async () => {
    userBackend(server, {
      secondPillarContributions: {
        contributing: false,
        restartDate: '2027-05-01',
        rejoinPossibleFrom: null,
      },
    });
    pensionikeskusSays(true);

    render('/2nd-pillar-flow');

    expect(await secondPillarFlowStart()).toBeInTheDocument();
    expect(history.location.pathname).toMatch(/^\/2nd-pillar-flow\//);
  });

  test('lets someone who is contributing through without asking Pensionikeskus', async () => {
    pensionikeskusSays(true);

    render('/2nd-pillar-flow');

    expect(await secondPillarFlowStart()).toBeInTheDocument();
    await waitFor(() => expect(history.location.pathname).toMatch(/^\/2nd-pillar-flow\//));
    expect(permissionRequests).toBe(0);
  });

  test('lets someone through when Pensionikeskus cannot be asked', async () => {
    stoppedContributing();
    server.use(
      rest.get('http://localhost/v1/rejoin-permission', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({})),
      ),
    );

    render('/2nd-pillar-flow');

    expect(await secondPillarFlowStart()).toBeInTheDocument();
    expect(history.location.pathname).toMatch(/^\/2nd-pillar-flow\//);
  });
});
