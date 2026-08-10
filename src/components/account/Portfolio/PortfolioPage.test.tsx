import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
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

const requestedPeriods: { from: string | null; to: string | null }[] = [];

const portfolioBackend = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) => {
      requestedPeriods.push({
        from: req.url.searchParams.get('from'),
        to: req.url.searchParams.get('to'),
      });
      return res(ctx.json(req.url.searchParams.get('from') ? lastYear : allTime));
    }),
  );

const portfolioBackendRefusingNarrowedPeriods = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) =>
      req.url.searchParams.get('from')
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(allTime)),
    ),
  );

const portfolioBackendDown = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
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
  requestedPeriods.length = 0;
  portfolioBackend();
});

describe('a portfolio the backend has not answered with yet', () => {
  it('shows the period someone can change while the numbers are still coming', async () => {
    initializeComponent();

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.getByLabelText('from')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All time' })).toBeInTheDocument();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).not.toBeInTheDocument();
  });
});

describe('a start date someone chose themselves', () => {
  it('is the period the backend is asked for', async () => {
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.type(screen.getByLabelText('from'), '2025-01-01');
    // Leaving the box asks for the period at once, rather than waiting out the pause
    // that a person still typing is given.
    fireEvent.blur(screen.getByLabelText('from'));

    expect(await screen.findAllByText(/600[.,]00/)).not.toHaveLength(0);
    expect(requestedPeriods[requestedPeriods.length - 1]).toEqual({
      from: '2025-01-01',
      to: moment().format('YYYY-MM-DD'),
    });
  });
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

describe('a period the backend cannot serve', () => {
  it('leaves the period on the page so someone can ask for another one', async () => {
    portfolioBackendRefusingNarrowedPeriods();
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findByText(/cannot load fund prices/)).toBeInTheDocument();
    expect(screen.getByLabelText('from')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'All time' }));

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);
    expect(screen.queryByText(/cannot load fund prices/)).not.toBeInTheDocument();
  });
});

describe('a portfolio the backend never gave', () => {
  it('asks the backend again when someone says to', async () => {
    portfolioBackendDown();
    initializeComponent();

    expect(await screen.findByText(/cannot load fund prices/)).toBeInTheDocument();
    expect(screen.getByLabelText('from')).toBeInTheDocument();

    portfolioBackend();

    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);
    expect(screen.queryByText(/cannot load fund prices/)).not.toBeInTheDocument();
  });
});
