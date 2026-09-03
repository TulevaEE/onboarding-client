import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import { userBackend, useTestBackends } from '../../../../test/backend';
import { Role } from '../../../common/apiModels';

type TrackedEvent = { type: string; data?: { path: string; savingsFundNudge?: string } };

describe('SavingsFundPaymentSuccess', () => {
  const childRole: Role = { type: 'PERSON', code: '51201011234', name: 'Junior Doe' };
  const companyRole: Role = { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test Company OÜ' };

  const server = setupServer();
  let history: History;
  let queryClient: QueryClient;

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    queryClient = new QueryClient();
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store, queryClient);
  };

  const trackEvents = (): TrackedEvent[] => {
    const trackedEvents: TrackedEvent[] = [];
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body as TrackedEvent);
        return res(ctx.json({}));
      }),
    );
    return trackedEvents;
  };

  const recurringNudgeViews = (trackedEvents: TrackedEvent[]) =>
    trackedEvents.filter(
      ({ type, data }) => type === 'PAGE_VIEW' && data?.savingsFundNudge === 'RECURRING_PAYMENT',
    );

  const userUpdateCount = () => queryClient.getQueryState(['user'])?.dataUpdateCount ?? 0;

  const settlePendingRequests = () =>
    act(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        }),
    );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
  });

  it('shows the success message with a link to the account page', async () => {
    initApp();
    history.push('/savings-fund/payment/success');

    expect(await screen.findByRole('heading', { name: 'Deposit made' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The deposit amount will be invested in the fund within two business days. We will notify you of this by email.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  });

  it('nudges to set up a recurring payment', async () => {
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'With a recurring payment, a deposit reaches your account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up a recurring payment' })).toHaveAttribute(
      'href',
      '/savings-fund/payment?type=RECURRING',
    );
  });

  it('tracks the nudge view', async () => {
    const trackedEvents = trackEvents();
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'PAGE_VIEW',
        data: {
          path: '/savings-fund/payment/success',
          savingsFundNudge: 'RECURRING_PAYMENT',
        },
      }),
    );
  });

  it('tracks the nudge view once when the user data is refetched', async () => {
    const trackedEvents = trackEvents();
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(recurringNudgeViews(trackedEvents)).toHaveLength(1));

    const userUpdatesBeforeRefetch = userUpdateCount();
    userBackend(server, { email: 'changed@example.com' });
    await act(() => queryClient.invalidateQueries({ queryKey: ['user'] }));
    await waitFor(() => expect(userUpdateCount()).toBeGreaterThan(userUpdatesBeforeRefetch));
    await settlePendingRequests();

    expect(recurringNudgeViews(trackedEvents)).toHaveLength(1);
  });

  it('words the nudge for the child when paying under a child role', async () => {
    userBackend(server, { role: childRole });
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByText(
        'With a recurring payment, a deposit reaches your child’s account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
  });

  it('words the nudge for the company when paying under a company role', async () => {
    userBackend(server, { role: companyRole });
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByText(
        'With a recurring payment, a deposit reaches your company’s account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
  });
});
