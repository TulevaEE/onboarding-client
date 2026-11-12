import React from 'react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  fundsBackend,
  neverAnswer,
  pensionAccountStatementBackend,
  secondPillarNavHistoriesBackend,
  useTestBackends,
  userBackend,
  worldMarketReturnsBackend,
} from '../../test/backend';
import { Fund, FundBalance, FundNavHistory, NavValue } from '../common/apiModels';
import { SecondPillarFunds } from './SecondPillarFunds';
import { minusYears } from './fundReturns';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TULEVA = 'Tuleva World Stocks Pension Fund';
const SWEDBANK = 'Swedbank Pension Fund K60';
const LHV = 'LHV Pension Fund Index';

const fund = (
  isin: string,
  name: string,
  ongoingChargesFigure: number,
  volume: number,
  pillar: 2 | 3 = 2,
): Fund => ({
  isin,
  name,
  nav: 1,
  pillar,
  managementFeeRate: ongoingChargesFigure,
  ongoingChargesFigure,
  fundManager: { name: name.split(' ')[0] },
  status: 'ACTIVE',
  inceptionDate: '2016-01-01',
  volume,
});

const funds = [
  fund('EE3600109435', TULEVA, 0.0028, 2_500_000_000),
  fund('EE3600019758', SWEDBANK, 0.0065, 1_000_000_000),
  fund('EE3600109401', LHV, 0.0027, 290_000_000),
  fund('EE3600001707', 'Tuleva III Pillar Pension Fund', 0.0029, 400_000_000, 3),
];

const nav = (date: string, value: number): NavValue => ({ date, value });

const navHistories: FundNavHistory[] = [
  {
    isin: 'EE3600109435',
    nav: [
      nav('2016-07-13', 1),
      nav('2021-07-13', 1.25),
      nav('2023-07-13', 1.6),
      nav('2024-07-12', 1.8),
      nav('2025-07-11', 2.2),
      nav('2026-07-13', 2.5),
    ],
  },
  {
    isin: 'EE3600019758',
    nav: [
      nav('2021-07-13', 1),
      nav('2023-07-13', 1.1),
      nav('2024-07-12', 1.15),
      nav('2026-07-13', 1.3),
    ],
  },
  {
    isin: 'EE3600109401',
    nav: [nav('2023-07-13', 1), nav('2024-07-12', 1.1), nav('2026-07-13', 1.4)],
  },
];

const worldMarketReturns = {
  returns: [1, 2, 3, 5, 10].map((years) => ({
    years,
    annualizedReturn: { 1: 0.2, 2: 0.154, 3: 0.188, 5: 0.118, 10: 0.116 }[years] as number,
    fromDate: minusYears('2026-07-13', years),
    toDate: '2026-07-13',
    composite: years === 10,
  })),
};

const holding = (isin: string, name: string, value: number): FundBalance => ({
  fund: {
    fundManager: { name: name.split(' ')[0] },
    isin,
    name,
    managementFeeRate: 0.0065,
    pillar: 2,
    ongoingChargesFigure: 0.0065,
    status: 'ACTIVE',
    inceptionDate: '2016-01-01',
    nav: 1,
  },
  value,
  unavailableValue: 0,
  currency: 'EUR',
  activeContributions: true,
  contributions: value,
  subtractions: 0,
  profit: 0,
  units: value,
});

let history: MemoryHistory;

const renderPage = (path = '/2nd-pillar-funds', language: 'en' | 'et' = 'en') => {
  history = createMemoryHistory({ initialEntries: [path] });
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <SecondPillarFunds />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    language,
  );
};

const fundTable = () => screen.findByRole('table', { name: /^Estonian II\spillar funds compared/ });

const ALL_FUNDS = '/2nd-pillar-funds';
const LOW_FEE_STOCK_FUNDS = '/2nd-pillar-funds?filters=low-fees,stock-funds';

const fundRow = async (name: string) =>
  within(await fundTable()).getByRole('row', { name: new RegExp(name) });

const hasCells = (row: HTMLElement) => within(row).queryAllByRole('cell').length > 0;

const fundNameOf = (row: HTMLElement) =>
  [TULEVA, SWEDBANK, LHV].find((name) => row.textContent?.includes(name));

const listedFunds = async () =>
  within(await fundTable())
    .getAllByRole('row')
    .filter(hasCells)
    .map(fundNameOf);

let requestedStartDates: string[];

beforeEach(() => {
  initializeConfiguration();
  window.history.replaceState(null, '', '/');
  useTestBackends(server);
  fundsBackend(server, funds);
  ({ requestedStartDates } = secondPillarNavHistoriesBackend(server, navHistories));
  worldMarketReturnsBackend(server, worldMarketReturns);
  pensionAccountStatementBackend(server, [holding('EE3600019758', SWEDBANK, 20000)]);
  userBackend(server, { secondPillarOpenDate: '2024-03-01' });
});

test("lists every active II pillar fund with its 5-year return, yearly fee on the person's II pillar savings and size in millions", async () => {
  renderPage(ALL_FUNDS);

  expect(await listedFunds()).toHaveLength(3);
  const tuleva = within(await fundRow(TULEVA));
  expect(tuleva.getByText('14.9')).toBeInTheDocument();
  expect(tuleva.getByText('−56 €')).toBeInTheDocument();
  expect(tuleva.getByText('2 500')).toBeInTheDocument();
  const swedbank = within(await fundRow(SWEDBANK));
  expect(swedbank.getByText('5.4')).toBeInTheDocument();
  expect(swedbank.getByText('−130 €')).toBeInTheDocument();
  expect(within(await fundRow(LHV)).getByText('—')).toBeInTheDocument();
  expect(await screen.findByText(/World market level/)).toBeInTheDocument();
});

test('writes numbers with a decimal point in Estonian too, as the rest of the app does', async () => {
  renderPage(ALL_FUNDS, 'et');

  const table = await screen.findByRole('table', { name: /^Eesti II\ssamba fondide võrdlus/ });
  const tuleva = within(within(table).getByRole('row', { name: new RegExp(TULEVA) }));
  expect(tuleva.getByText('14.9')).toBeInTheDocument();
  expect(tuleva.getByText('2 500')).toBeInTheDocument();
});

test("explains under the table that the fees are on the person's II pillar savings", async () => {
  renderPage();

  expect(
    await screen.findByText(
      /Fees in the table are in euros a year on all your current II\spillar savings\./,
    ),
  ).toBeInTheDocument();
});

test('shows fees for every 10 000 € to a person without II pillar savings', async () => {
  pensionAccountStatementBackend(server, []);

  renderPage();

  expect(within(await fundRow(TULEVA)).getByText('−28 €')).toBeInTheDocument();
  expect(
    screen.getByText(/Fees in the table are in euros a year for every 10\s000\s€ in the fund\./),
  ).toBeInTheDocument();
});

test('orders the funds by 5-year return, best first, with funds too young for the period last', async () => {
  renderPage(ALL_FUNDS);

  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
});

test('sorts by fees, cheapest first, and flips the order on a second click', async () => {
  renderPage(ALL_FUNDS);
  await fundTable();

  userEvent.click(screen.getByRole('button', { name: /^Fees/ }));
  expect(await listedFunds()).toEqual([LHV, TULEVA, SWEDBANK]);

  userEvent.click(screen.getByRole('button', { name: /^Fees/ }));
  expect(await listedFunds()).toEqual([SWEDBANK, TULEVA, LHV]);
});

test('marks the funds the person saves in', async () => {
  renderPage(ALL_FUNDS);

  expect(within(await fundRow(SWEDBANK)).getByText('Your fund')).toBeInTheDocument();
  expect(within(await fundRow(TULEVA)).queryByText('Your fund')).not.toBeInTheDocument();
});

test('highlights the Tuleva stock fund and the funds the person saves in for comparison', async () => {
  renderPage(ALL_FUNDS);

  expect(await fundRow(TULEVA)).toHaveClass('highlighted');
  expect(await fundRow(SWEDBANK)).toHaveClass('highlighted');
  expect(await fundRow(LHV)).not.toHaveClass('highlighted');
});

test('explains that a return marked green is close to the world market', async () => {
  renderPage();

  userEvent.hover(within(await fundRow(TULEVA)).getByText('14.9'));

  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    /^Over the past 5 years, the fund's return has been close to the world stock market index/,
  );
});

test('starts with every fund and no filter on', async () => {
  renderPage();

  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
  expect(screen.getByRole('button', { name: 'Low fees' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Stock funds' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(screen.queryByText(/funds? match the filters/)).not.toBeInTheDocument();
  expect(screen.getByText(/^Showing all 3\sfunds\.$/)).toBeInTheDocument();
});

test('keeps the funds the person saves in among the filtered funds', async () => {
  renderPage(LOW_FEE_STOCK_FUNDS);

  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
  expect(within(await fundRow(SWEDBANK)).getByText('Your fund')).toBeInTheDocument();
  expect(screen.getByText(/^2\sfunds match the filters out of 3\./)).toBeInTheDocument();
});

test('leaves out high-fee funds the person does not save in', async () => {
  pensionAccountStatementBackend(server, [holding('EE3600109435', TULEVA, 20000)]);

  renderPage(LOW_FEE_STOCK_FUNDS);

  expect(await listedFunds()).toEqual([TULEVA, LHV]);
  expect(within(await fundRow(TULEVA)).getByText('Your fund')).toBeInTheDocument();
});

test('shows every fund once both filters are turned off', async () => {
  pensionAccountStatementBackend(server, [holding('EE3600109435', TULEVA, 20000)]);
  renderPage(LOW_FEE_STOCK_FUNDS);
  await fundTable();

  userEvent.click(screen.getByRole('button', { name: 'Low fees' }));
  userEvent.click(screen.getByRole('button', { name: 'Stock funds' }));

  expect(screen.getByRole('button', { name: 'Low fees' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Stock funds' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
  expect(window.location.search).toBe('');
  expect(history.location.search).toBe('?filters=low-fees,stock-funds');
});

test('shows every fund from the link next to the filter count', async () => {
  pensionAccountStatementBackend(server, [holding('EE3600109435', TULEVA, 20000)]);
  renderPage(LOW_FEE_STOCK_FUNDS);
  await fundTable();

  userEvent.click(screen.getByRole('button', { name: 'Show all funds' }));

  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
  expect(window.location.search).toBe('');
  expect(history.location.search).toBe('?filters=low-fees,stock-funds');
});

test('opens with the filters a link carries, keeping the funds the person saves in', async () => {
  renderPage('/2nd-pillar-funds?filters=stock-funds');

  expect(await listedFunds()).toEqual([TULEVA, SWEDBANK, LHV]);
  expect(screen.getByRole('button', { name: 'Stock funds' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: 'Low fees' })).toHaveAttribute('aria-pressed', 'false');
});

test('has no period picker unless the link asks for one', async () => {
  renderPage();
  await fundTable();

  expect(screen.queryByRole('combobox', { name: 'Return period' })).not.toBeInTheDocument();
});

test('compares returns over the period a link asks for, with enough history fetched for it', async () => {
  renderPage('/2nd-pillar-funds?period=10');

  expect(within(await fundRow(TULEVA)).getByText('9.6')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Return period' })).toHaveValue('10');
  expect(requestedStartDates[0] <= minusYears(new Date().toISOString().slice(0, 10), 10)).toBe(
    true,
  );
});

test('lists the 2, 3 and 5 year returns of every fund at the end of the page', async () => {
  renderPage();

  const table = await screen.findByRole('table', {
    name: /^Average annual fund returns over 2, 3 and 5\syears$/,
  });
  const rows = within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
  expect(rows).toEqual([
    [TULEVA, '17.8%', '16.0%', '14.9%'],
    [SWEDBANK, '6.3%', '5.7%', '5.4%'],
    [LHV, '12.8%', '11.9%', '—'],
  ]);
});

test('describes a fee to screen readers with its explanation', async () => {
  renderPage();
  const fee = within(await fundRow(TULEVA)).getByText('−56 €');

  userEvent.hover(fee);
  expect(await screen.findByRole('tooltip')).toBeInTheDocument();

  expect(fee).toHaveAccessibleDescription(
    /^This fund's ongoing charges are 0\.28% a year, or 56\s€ on all your current II\spillar savings\./,
  );
});

test('speaks of a single year in the market comparison over a one-year period', async () => {
  userBackend(server, { secondPillarOpenDate: '2026-06-01' });
  renderPage('/2nd-pillar-funds?period=1');

  userEvent.hover(within(await fundRow(TULEVA)).getByText('13.6'));

  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    /^Over the past year, the fund's return has/,
  );
});

test('keeps a fund without price history in the list, without a return', async () => {
  secondPillarNavHistoriesBackend(
    server,
    navHistories.filter((navHistory) => navHistory.isin !== 'EE3600109401'),
  );

  renderPage(ALL_FUNDS);

  expect(within(await fundRow(LHV)).getByText('—')).toBeInTheDocument();
});

test('waits for the account statement before listing funds, so the funds the person saves in do not jump in later', async () => {
  server.use(rest.get('http://localhost/v1/pension-account-statement', neverAnswer));

  renderPage();

  expect(
    await screen.findByRole('table', { name: /^Average annual fund returns/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: /^Estonian II\spillar funds compared/ }),
  ).not.toBeInTheDocument();
});

test('says an error occurred when no fund has any price history', async () => {
  secondPillarNavHistoriesBackend(server, []);

  renderPage();

  expect(
    await screen.findByText('An error occurred. Please try again or reach out to us.'),
  ).toBeInTheDocument();
});

test('leaves out the world market comparison when the benchmark cannot be loaded', async () => {
  server.use(
    rest.get('http://localhost/v1/benchmarks/world-market/returns', (req, res, ctx) =>
      res(ctx.status(500)),
    ),
  );

  renderPage();
  await fundTable();

  expect(screen.queryByText(/World market level/)).not.toBeInTheDocument();
  expect(screen.queryByText(/A return marked green/)).not.toBeInTheDocument();
});

test('leaves out the world market comparison when the benchmark ends more than a week from the fund prices', async () => {
  worldMarketReturnsBackend(server, {
    returns: worldMarketReturns.returns.map((benchmark) => ({
      ...benchmark,
      toDate: '2026-06-01',
    })),
  });

  renderPage();
  await fundTable();

  expect(screen.queryByText(/World market level/)).not.toBeInTheDocument();
});

test('ends with the methodology, after the table of returns by period', async () => {
  renderPage();

  const table = await screen.findByRole('table', { name: /^Average annual fund returns/ });
  const methodology = screen.getByText(/^Returns are in percent a year/);

  expect(table.compareDocumentPosition(methodology)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

test('offers to switch funds right next to the deadline at the top', async () => {
  renderPage();

  expect(await screen.findByRole('link', { name: 'Switch funds' })).toHaveAttribute(
    'href',
    '/2nd-pillar-flow',
  );
});

const personalReturnsBackend = () => {
  const requests: { keys: string[]; from: string | null; to: string | null }[] = [];
  server.use(
    rest.get('http://localhost/v1/returns', (req, res, ctx) => {
      const keys = [
        ...req.url.searchParams.getAll('keys'),
        ...req.url.searchParams.getAll('keys[]'),
      ];
      requests.push({
        keys,
        from: req.url.searchParams.get('from'),
        to: req.url.searchParams.get('to'),
      });
      return res(
        ctx.json({
          returns: keys.map((key) => ({
            type: 'FUND',
            key,
            rate: { EE3600109435: 0.0812, UNION_STOCK_INDEX: 0.06 }[key] ?? 0.0345,
            amount: 1000,
            paymentsSum: 900,
            currency: 'EUR',
          })),
          from: '2021-11-11',
          to: '2026-11-11',
        }),
      );
    }),
  );
  return requests;
};

test("shows what the person's own contributions would have earned in each fund when the person's II pillar is older than the period", async () => {
  userBackend(server, { secondPillarOpenDate: '2015-03-01' });
  const requests = personalReturnsBackend();

  renderPage();

  expect(within(await fundRow(TULEVA)).getByText('8.1')).toBeInTheDocument();
  expect(within(await fundRow(SWEDBANK)).getByText('3.5')).toBeInTheDocument();
  expect(
    screen.getByText(/^Returns and fees are based on your own II\spillar\./),
  ).toHaveTextContent(
    /the fees what you would pay a year if all your current savings were in that fund\.$/,
  );
  const marketReturn = within(await fundRow('World market index')).getByText('6.0');
  expect(marketReturn).toHaveClass('nearMarket');
  const rowNames = within(await fundTable())
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      [TULEVA, 'World market index', SWEDBANK, LHV].find((name) => row.textContent?.includes(name)),
    );
  expect(rowNames.slice(0, 2)).toEqual([TULEVA, 'World market index']);
  expect(requests[0].keys).toEqual(
    expect.arrayContaining(['EE3600109435', 'EE3600019758', 'UNION_STOCK_INDEX']),
  );
  expect(requests[0].from).toBe('2021-07-13');
  expect(requests[0].to).toBe('2026-07-13');
});

test('compares every fund on the newest date all of them have a NAV for, when some publish a day earlier than others', async () => {
  userBackend(server, { secondPillarOpenDate: '2015-03-01' });
  const requests = personalReturnsBackend();
  secondPillarNavHistoriesBackend(
    server,
    navHistories.map((fundHistory) =>
      fundHistory.isin === 'EE3600109435'
        ? fundHistory
        : { ...fundHistory, nav: [...fundHistory.nav, nav('2026-07-14', 9)] },
    ),
  );

  renderPage();

  const table = await screen.findByRole('table', { name: /^Average annual fund returns/ });
  const rows = within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
  expect(rows).toEqual([
    [TULEVA, '17.8%', '16.0%', '14.9%'],
    [SWEDBANK, '6.3%', '5.7%', '5.4%'],
    [LHV, '12.8%', '11.9%', '—'],
  ]);
  expect(requests[0]).toEqual(expect.objectContaining({ from: '2021-07-13', to: '2026-07-13' }));
});

test('compares the personal return of each fund with the world market return on the same contributions', async () => {
  userBackend(server, { secondPillarOpenDate: '2015-03-01' });
  personalReturnsBackend();

  renderPage();

  userEvent.hover(within(await fundRow(TULEVA)).getByText('8.1'));
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    /^Over the past 5 years, your contributions would have earned close to the world market index return/,
  );
  expect(
    screen.getByText(/A return marked green = your contributions would have earned/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/internal rate of return \(XIRR\) on your own money/),
  ).toBeInTheDocument();
});

test("labels the world market row as measured with the person's contributions and names its index in the methodology", async () => {
  userBackend(server, { secondPillarOpenDate: '2015-03-01' });
  personalReturnsBackend();

  renderPage();

  expect(
    within(await fundRow('World market index')).getByText('with your contributions'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /world market index return \(Morningstar Global Markets; until the end of 2019/,
    ),
  ).toBeInTheDocument();
});

test('leaves the fee and size cells of the world market row empty instead of filling them with dashes', async () => {
  userBackend(server, { secondPillarOpenDate: '2015-03-01' });
  personalReturnsBackend();

  renderPage();

  const row = await fundRow('World market index');
  expect(
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent),
  ).toEqual(['World market indexwith your contributions', '6.0%']);
});

test("keeps the fund returns when the person's II pillar is younger than the period", async () => {
  userBackend(server, { secondPillarOpenDate: '2024-03-01' });
  personalReturnsBackend();

  renderPage();

  expect(within(await fundRow(TULEVA)).getByText('14.9')).toBeInTheDocument();
  expect(
    screen.queryByText(/^Returns and fees are based on your own II\spillar\./),
  ).not.toBeInTheDocument();
});

test('leads to the II pillar flow', async () => {
  renderPage();
  await fundTable();

  expect(screen.getByRole('link', { name: /^Review my II\spillar$/ })).toHaveAttribute(
    'href',
    '/2nd-pillar-flow',
  );
});

test('says an error occurred when the fund returns cannot be loaded', async () => {
  server.use(rest.get('http://localhost/v1/funds/nav', (req, res, ctx) => res(ctx.status(500))));

  renderPage();

  expect(
    await screen.findByText('An error occurred. Please try again or reach out to us.'),
  ).toBeInTheDocument();
});
