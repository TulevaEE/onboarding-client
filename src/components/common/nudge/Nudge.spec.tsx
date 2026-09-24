import React from 'react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackendsExcept } from '../../../test/backend';
import { NudgeView } from './Nudge';
import { NudgeDecision } from '../apiModels/nudge';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('nudge view tracking', () => {
  const views: Record<string, unknown>[] = [];

  afterEach(() => {
    views.length = 0;
  });

  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['trackedEvents']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        const body = req.body as { type: string; data: Record<string, unknown> };
        if (body.type === 'NUDGE_VIEW') {
          views.push(body.data);
        }
        return res(ctx.json({}));
      }),
    );
  });

  test('tracks one view per rendered decision, and a new view when the decision changes', async () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    const thirdPillar: NudgeDecision = { key: 'THIRD_PILLAR_START', tag: 'nudge_third_pillar' };
    const paymentRate: NudgeDecision = {
      key: 'SECOND_PILLAR_PAYMENT_RATE',
      tag: 'nudge_payment_rate',
    };

    const { rerender } = renderWrapped(
      <NudgeView decision={thirdPillar} context="SECOND_PILLAR_MANDATE" />,
      history as any,
      store,
    );
    await waitFor(() => expect(views).toHaveLength(1));

    rerender(<NudgeView decision={thirdPillar} context="SECOND_PILLAR_MANDATE" />);
    rerender(<NudgeView decision={paymentRate} context="SECOND_PILLAR_MANDATE" />);
    await waitFor(() => expect(views).toHaveLength(2));

    rerender(<NudgeView decision={paymentRate} context="SECOND_PILLAR_MANDATE" />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(views.map((view) => view.key)).toEqual([
      'THIRD_PILLAR_START',
      'SECOND_PILLAR_PAYMENT_RATE',
    ]);
  });
});

describe('second pillar start nudge', () => {
  const views: Record<string, unknown>[] = [];

  afterEach(() => {
    views.length = 0;
  });

  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['trackedEvents']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        const body = req.body as { type: string; data: Record<string, unknown> };
        if (body.type === 'NUDGE_VIEW') {
          views.push(body.data);
        }
        return res(ctx.json({}));
      }),
    );
  });

  test('invites a person without a second pillar to open one in the second pillar flow', async () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    const start: NudgeDecision = { key: 'SECOND_PILLAR_START', tag: 'nudge_second_pillar_start' };

    renderWrapped(
      <NudgeView decision={start} context="THIRD_PILLAR_PAYMENT" />,
      history as any,
      store,
    );

    expect(
      await screen.findByRole('heading', { name: 'Next, it is smart to open a second pillar' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/You do not have a second pillar yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open my second pillar' })).toHaveAttribute(
      'href',
      '/2nd-pillar-flow',
    );
    await waitFor(() =>
      expect(views).toEqual([
        {
          context: 'THIRD_PILLAR_PAYMENT',
          key: 'SECOND_PILLAR_START',
          tag: 'nudge_second_pillar_start',
          path: '/',
          channel: 'SCREEN',
        },
      ]),
    );
  });
});
