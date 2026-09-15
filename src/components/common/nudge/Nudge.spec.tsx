import React from 'react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackendsExcept } from '../../../test/backend';
import { NudgeView } from './Nudge';
import { NudgeDecision } from '../apiModels/nudge';

describe('nudge view tracking', () => {
  const server = setupServer();
  const views: Record<string, unknown>[] = [];

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    views.length = 0;
  });
  afterAll(() => server.close());

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
