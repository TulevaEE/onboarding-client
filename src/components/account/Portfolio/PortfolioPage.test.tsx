import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import download from 'downloadjs';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { userBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { Portfolio, RoleType, Transaction } from '../../common/apiModels';
import { PortfolioPage } from './PortfolioPage';

jest.mock('downloadjs');

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

const fundBalance = (pillar: number | null, value: number, unavailableValue: number) => ({
  fund: {
    isin: `EE${pillar}${value}`,
    name: `Fund ${pillar}`,
    fundManager: { name: 'Tuleva' },
    managementFeeRate: 0.0034,
    pillar,
    ongoingChargesFigure: 0.0039,
  },
  value,
  unavailableValue,
  currency: 'EUR',
  activeContributions: true,
  contributions: 0,
  subtractions: 0,
  profit: 0,
  units: 1,
});

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

const statementRequests: string[] = [];

const registerHolding = (funds: unknown[], savingsFund: unknown | null) =>
  server.use(
    rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) => {
      statementRequests.push(req.url.pathname);
      return res(ctx.json(funds));
    }),
    rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
      res(ctx.json(savingsFund)),
    ),
  );

const registerRefusingTheSavingsBalance = (funds: unknown[]) =>
  server.use(
    rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) =>
      res(ctx.json(funds)),
    ),
    rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

const savingsFund = {
  isin: 'EE0000000001',
  name: 'Tuleva Täiendav Kogumisfond',
  fundManager: { name: 'Tuleva' },
  managementFeeRate: 0.0025,
  pillar: null,
  ongoingChargesFigure: 0.0025,
};

const pillarFund = {
  isin: 'EE3600109435',
  name: 'Tuleva World Stocks Pension Fund',
  fundManager: { name: 'Tuleva' },
  managementFeeRate: 0.0034,
  pillar: 2,
  ongoingChargesFigure: 0.0039,
};

const savingsTransaction = (
  time: string,
  units: number,
  nav: number,
  amount: number,
  type: Transaction['type'] = 'CONTRIBUTION_CASH',
): Transaction => ({
  id: time,
  amount,
  currency: 'EUR',
  time,
  isin: savingsFund.isin,
  type,
  units,
  nav,
});

const accountHolding = (transactions: Transaction[]) =>
  server.use(
    rest.get('http://localhost/v1/funds', (req, res, ctx) =>
      res(ctx.json([savingsFund, pillarFund])),
    ),
    rest.get('http://localhost/v1/transactions', (req, res, ctx) => res(ctx.json(transactions))),
  );

const actingFor = (roleType: RoleType) =>
  userBackend(server, { role: { type: roleType, code: '90000000', name: 'Acme' } });

const actingForThemselves = () => userBackend(server, { role: undefined });

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
  jest.clearAllMocks();
  requestedPeriods.length = 0;
  statementRequests.length = 0;
  portfolioBackend();
  registerHolding([], null);
  accountHolding([]);
  actingFor('PERSON');
});

describe('what the register holds today', () => {
  it('is the closing value of a period that runs to today', async () => {
    registerHolding([fundBalance(2, 700, 77)], fundBalance(null, 111, 11));
    initializeComponent();

    // 777 in the II pillar and 122 in the savings fund, rather than the 500 the
    // published prices rebuild from units alone.
    expect(await screen.findAllByText(/899[.,]00/)).not.toHaveLength(0);
  });

  it('is left out of a period that ended before today', async () => {
    registerHolding([fundBalance(2, 700, 77)], fundBalance(null, 111, 11));
    initializeComponent();

    expect(await screen.findAllByText(/899[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findAllByText(/600[.,]00/)).not.toHaveLength(0);
    expect(screen.queryByText(/899[.,]00/)).not.toBeInTheDocument();
  });

  it('waits for the whole register answer rather than mixing it with rebuilt values', async () => {
    registerRefusingTheSavingsBalance([fundBalance(2, 700, 77)]);
    initializeComponent();

    // 200 savings fund + 300 II pillar, the values the prices rebuilt: a balance for one
    // band and a rebuilt value for the other would add up to a total from neither source.
    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);
    expect(screen.queryByText(/1[\s ]?077[.,]00/)).not.toBeInTheDocument();
  });

  it('does not ask the pension register about a company', async () => {
    actingFor('LEGAL_ENTITY');
    registerHolding([fundBalance(2, 700, 77)], fundBalance(null, 111, 11));
    initializeComponent();

    // 122 in the savings fund the company does hold, on top of the 300 the prices
    // rebuilt; a company holds no pillar, so the register is never asked about one.
    expect(await screen.findAllByText(/422[.,]00/)).not.toHaveLength(0);
    expect(statementRequests).toHaveLength(0);
  });

  it('is asked for when someone is acting as themselves', async () => {
    actingForThemselves();
    registerHolding([fundBalance(2, 700, 77)], fundBalance(null, 111, 11));
    initializeComponent();

    expect(await screen.findAllByText(/899[.,]00/)).not.toHaveLength(0);
    expect(statementRequests).not.toHaveLength(0);
  });

  it('leaves a pillar the register says nothing about on its rebuilt value', async () => {
    registerHolding([fundBalance(3, 900, 0)], null);
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);
  });
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

describe('the savings fund statement', () => {
  const holdingHistory = [
    savingsTransaction('2024-06-01T10:00:00Z', 10, 1.0, 10),
    savingsTransaction('2025-03-10T10:00:00Z', 20, 1.1, 22),
    savingsTransaction('2025-08-01T10:00:00Z', 5, 1.2, -6, 'SUBTRACTION'),
    savingsTransaction('2026-02-01T10:00:00Z', 7, 1.3, 9.1),
  ];

  it('shows only the transactions of the selected period', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findAllByText('10.03.2025')).not.toHaveLength(0);
    expect(screen.getAllByText('01.08.2025')).not.toHaveLength(0);
    expect(screen.queryByText('01.02.2026')).not.toBeInTheDocument();
  });

  it('carries the opening and closing units into the printable statement', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findByText('Opening balance 01.01.2025')).toBeInTheDocument();
    // 10 units bought before the period; 10 + 20 − 5 held at its end.
    expect(screen.getAllByText(/10[.,]0000/)).not.toHaveLength(0);
    expect(screen.getByText('Closing balance 31.12.2025')).toBeInTheDocument();
    expect(screen.getAllByText(/25[.,]0000/)).not.toHaveLength(0);
  });

  it('downloads the period as CSV', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));
    expect(await screen.findAllByText('10.03.2025')).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(download).toHaveBeenCalledTimes(1);
    const [content, filename] = (download as jest.Mock).mock.calls[0];
    expect(filename).toBe('tuleva-kogumisfondi-valjavote-2025-01-01-2025-12-31.csv');
    expect(content).toContain('10.03.2025;Contribution;20,0000;1,10000;22,00');
    expect(content).toContain('01.08.2025;Redemption;-5,0000;1,20000;-6,00');
    expect(content).not.toContain('01.02.2026');
  });

  it('opens the print dialog for the PDF', async () => {
    const print = jest.spyOn(window, 'print').mockImplementation(() => {});
    accountHolding(holdingHistory);
    initializeComponent();

    userEvent.click(await screen.findByRole('button', { name: 'Save as PDF' }));

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });

  it('is left out when nothing is held in the savings fund', async () => {
    server.use(
      rest.get('http://localhost/v1/portfolio', (req, res, ctx) =>
        res(
          ctx.json({
            ...allTime,
            groups: allTime.groups.filter((group) => group.group !== 'SAVINGS_FUND'),
            series: [
              { date: '2020-01-01', values: { SECOND_PILLAR: 100 } },
              { date: '2026-08-07', values: { SECOND_PILLAR: 300 } },
            ],
          }),
        ),
      ),
    );
    initializeComponent();

    expect(await screen.findAllByText(/300[.,]00/)).not.toHaveLength(0);
    expect(screen.queryByText('Transactions in the selected period')).not.toBeInTheDocument();
  });
});

describe('a portfolio the backend never gave', () => {
  it('says so where a screen reader will hear it', async () => {
    portfolioBackendDown();
    initializeComponent();

    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot load fund prices/);
  });

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
