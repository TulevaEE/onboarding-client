import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackends } from '../../../test/backend';
import { NudgeView } from './Nudge';
import { NudgeDecision } from '../apiModels/nudge';
import serverDecisions from './nudge-decisions.json';

describe('Nudge decision contract', () => {
  const server = setupServer();
  const decisions = serverDecisions as NudgeDecision[];

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
  });

  const renderDecision = (decision: NudgeDecision) =>
    renderWrapped(
      <MemoryRouter initialEntries={['/3rd-pillar-success']}>
        <main>
          <NudgeView decision={decision} context="THIRD_PILLAR_PAYMENT" />
        </main>
      </MemoryRouter>,
      undefined,
      undefined,
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

  it('covers every key the server can return', () => {
    expect(decisions.map(({ key }) => key)).toEqual([
      'ACCOUNT_RECURRING',
      'SECOND_PILLAR_TRANSFER',
      'SECOND_PILLAR_TRANSFER',
      'SECOND_PILLAR_PAYMENT_RATE',
      'THIRD_PILLAR_START',
      'THIRD_PILLAR_FEES',
      'THIRD_PILLAR_RECURRING',
      'THIRD_PILLAR_RAISE',
      'SAVINGS_FUND',
      'SAVINGS_FUND_RECURRING',
      'MEMBERSHIP',
      'NONE',
    ]);
  });

  it.each(decisions.map((decision) => [decision.key, decision] as const))(
    'renders a single call to action for %s',
    async (_key, decision) => {
      renderDecision(decision);

      const main = within(await screen.findByRole('main'));
      const callsToAction = [...main.queryAllByRole('link'), ...main.queryAllByRole('button')];

      expect(callsToAction).toHaveLength(decision.key === 'NONE' ? 0 : 1);
    },
  );
});
