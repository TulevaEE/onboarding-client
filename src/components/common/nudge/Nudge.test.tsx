import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackendsExcept } from '../../../test/backend';
import { NudgeView } from './Nudge';
import { NudgeDecision } from '../apiModels/nudge';

type TrackedEvent = { type: string; data?: Record<string, unknown> };

describe('NudgeView tracking', () => {
  const server = setupServer();
  const membership: NudgeDecision = { key: 'MEMBERSHIP', tag: 'nudge_membership' };
  let trackedEvents: TrackedEvent[];

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    trackedEvents = [];
    useTestBackendsExcept(server, ['trackedEvents']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body as TrackedEvent);
        return res(ctx.json({}));
      }),
    );
  });

  const renderNudge = (decision: NudgeDecision) =>
    renderWrapped(
      <MemoryRouter initialEntries={['/3rd-pillar-success']}>
        <NudgeView decision={decision} context="THIRD_PILLAR_PAYMENT" />
      </MemoryRouter>,
      undefined,
      undefined,
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

  const eventsOfType = (type: string) => trackedEvents.filter((event) => event.type === type);

  it('tracks the view once, however often it rerenders', async () => {
    const { rerender } = renderNudge(membership);

    await waitFor(() => expect(eventsOfType('NUDGE_VIEW')).toHaveLength(1));
    expect(eventsOfType('NUDGE_VIEW')[0]).toEqual({
      type: 'NUDGE_VIEW',
      data: {
        context: 'THIRD_PILLAR_PAYMENT',
        key: 'MEMBERSHIP',
        tag: 'nudge_membership',
        path: '/3rd-pillar-success',
        channel: 'SCREEN',
      },
    });

    rerender(
      <MemoryRouter initialEntries={['/3rd-pillar-success']}>
        <NudgeView decision={membership} context="THIRD_PILLAR_PAYMENT" />
      </MemoryRouter>,
    );

    expect(eventsOfType('NUDGE_VIEW')).toHaveLength(1);
  });

  it('tracks nothing when the server decides on no nudge', async () => {
    renderNudge({ key: 'NONE', tag: 'nudge_none' });

    await waitFor(() => expect(screen.queryByRole('link')).not.toBeInTheDocument());
    expect(trackedEvents).toEqual([]);
  });

  it('tracks the click on the call to action', async () => {
    renderNudge(membership);

    userEvent.click(await screen.findByRole('link', { name: 'Become a member' }));

    await waitFor(() =>
      expect(eventsOfType('NUDGE_CLICK')).toEqual([
        {
          type: 'NUDGE_CLICK',
          data: {
            context: 'THIRD_PILLAR_PAYMENT',
            key: 'MEMBERSHIP',
            tag: 'nudge_membership',
            path: '/3rd-pillar-success',
            channel: 'SCREEN',
          },
        },
      ]),
    );
  });
});
