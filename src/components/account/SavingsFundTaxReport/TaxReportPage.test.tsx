import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { SavingsFundTaxReport } from '../../common/apiModels';
import { TaxReportPage } from './TaxReportPage';

const lastYear = moment().year() - 1;
const thisYear = moment().year();

const reportFor = (year: number, totalGain: number): SavingsFundTaxReport => ({
  year,
  method: 'WEIGHTED_AVERAGE',
  totalGain,
  redemptions: [
    {
      time: `${year}-09-10T10:00:00Z`,
      units: 40,
      acquisitionCost: 421.04,
      proceeds: 480,
      gain: totalGain,
    },
  ],
});

const server = setupServer();

const taxReportBackend = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) => {
      const year = Number(req.url.searchParams.get('year'));
      return res(ctx.json(reportFor(year, year === thisYear ? 12.34 : 58.96)));
    }),
  );

const taxReportBackendRefusingThisYear = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) =>
      Number(req.url.searchParams.get('year')) === thisYear
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(reportFor(lastYear, 58.96))),
    ),
  );

const taxReportBackendDown = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

function initializeComponent() {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(
    <TaxReportPage />,
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
  taxReportBackend();
});

describe('a tax report the backend never gave', () => {
  it('asks the backend again when someone says to', async () => {
    taxReportBackendDown();
    initializeComponent();

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: String(lastYear) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: String(thisYear) })).toBeInTheDocument();

    taxReportBackend();

    userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
    expect(screen.queryByText(/cannot load your tax report/)).not.toBeInTheDocument();
  });
});

describe('a tax year the backend cannot serve', () => {
  it('leaves the years on the page so someone can ask for another one', async () => {
    taxReportBackendRefusingThisYear();
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: String(thisYear) }));

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: String(lastYear) })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: String(lastYear) }));

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
    expect(screen.queryByText(/cannot load your tax report/)).not.toBeInTheDocument();
  });
});
