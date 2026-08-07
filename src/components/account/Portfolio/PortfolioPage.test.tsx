import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { Portfolio } from '../../common/apiModels';
import { PortfolioPage } from './PortfolioPage';

const allTime: Portfolio = {
  from: '2020-01-01',
  to: '2026-08-07',
  groups: [
    {
      group: 'SAVINGS_FUND',
      startValue: 100,
      endValue: 200,
      contributions: 50,
      withdrawals: 0,
      gain: 50,
      gainPercentage: 33.33,
      annualReturnRate: null,
    },
    {
      group: 'SECOND_PILLAR',
      startValue: 100,
      endValue: 300,
      contributions: 50,
      withdrawals: 0,
      gain: 70,
      gainPercentage: 30.0,
      annualReturnRate: null,
    },
  ],
  series: [
    { date: '2020-01-01', values: { SAVINGS_FUND: 100, SECOND_PILLAR: 100 } },
    { date: '2026-08-07', values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
  ],
};

const lastYear: Portfolio = {
  from: '2025-01-01',
  to: '2025-12-31',
  groups: [
    {
      group: 'SAVINGS_FUND',
      startValue: 120,
      endValue: 250,
      contributions: 30,
      withdrawals: 0,
      gain: 100,
      gainPercentage: 40.0,
      annualReturnRate: null,
    },
    {
      group: 'SECOND_PILLAR',
      startValue: 180,
      endValue: 350,
      contributions: 40,
      withdrawals: 0,
      gain: 130,
      gainPercentage: 41.0,
      annualReturnRate: null,
    },
  ],
  series: [
    { date: '2025-01-01', values: { SAVINGS_FUND: 120, SECOND_PILLAR: 180 } },
    { date: '2025-12-31', values: { SAVINGS_FUND: 250, SECOND_PILLAR: 350 } },
  ],
};

const server = setupServer();

const portfolioBackend = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) =>
      res(ctx.json(req.url.searchParams.get('from') ? lastYear : allTime)),
    ),
  );

function initializeComponent() {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(
    <PortfolioPage />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  portfolioBackend();
});

describe('the bands someone switched off', () => {
  it('stay switched off when they ask for another period', async () => {
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: /II\spillar/ }));

    expect(screen.getAllByText(/200[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findAllByText(/250[.,]00/)).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /II\spillar/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByText(/600[.,]00/)).not.toBeInTheDocument();
  });
});
