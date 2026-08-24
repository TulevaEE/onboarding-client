import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { userBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { CostBasisMethod, RoleType, SavingsFundTaxReport } from '../../common/apiModels';
import { TaxReportPage } from './TaxReportPage';

const lastYear = moment().year() - 1;
const thisYear = moment().year();

const totalGainOf = (year: number, method: CostBasisMethod) => {
  if (method === 'FIFO') {
    return year === thisYear ? 21.43 : 74.12;
  }
  return year === thisYear ? 12.34 : 58.96;
};

const reportFor = (year: number, method: CostBasisMethod): SavingsFundTaxReport => ({
  investmentAccount: null,
  year,
  method,
  totalGain: totalGainOf(year, method),
  redemptions: [
    {
      time: `${year}-09-10T10:00:00Z`,
      units: 40,
      acquisitionCost: method === 'FIFO' ? 405.88 : 421.04,
      proceeds: 480,
      gain: totalGainOf(year, method),
    },
  ],
});

const server = setupServer();

const requestedReports: { year: number; method: string | null }[] = [];

const CALCULATION_TIME_MS = 200;

const reportHandler = (delayInMilliseconds: number) =>
  rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) => {
    const year = Number(req.url.searchParams.get('year'));
    const method = req.url.searchParams.get('method') as CostBasisMethod;
    requestedReports.push({ year, method });
    return res(ctx.delay(delayInMilliseconds), ctx.json(reportFor(year, method)));
  });

const investmentAccountBackend = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban: null })),
    ),
  );

const taxReportBackend = () => server.use(reportHandler(0));

const taxReportBackendStillCalculating = () => server.use(reportHandler(CALCULATION_TIME_MS));

const taxReportBackendRefusingThisYear = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) =>
      Number(req.url.searchParams.get('year')) === thisYear
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(reportFor(lastYear, 'WEIGHTED_AVERAGE'))),
    ),
  );

const taxReportBackendRefusingFifo = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) =>
      req.url.searchParams.get('method') === 'FIFO'
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(reportFor(lastYear, 'WEIGHTED_AVERAGE'))),
    ),
  );

const taxReportBackendRefusingFifoForThisYear = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) => {
      const year = Number(req.url.searchParams.get('year'));
      const method = req.url.searchParams.get('method') as CostBasisMethod;
      return year === thisYear && method === 'FIFO'
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(reportFor(year, method)));
    }),
  );

const taxReportBackendRefusingWeightedAverageForLastYear = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) => {
      const year = Number(req.url.searchParams.get('year'));
      const method = req.url.searchParams.get('method') as CostBasisMethod;
      return year === lastYear && method === 'WEIGHTED_AVERAGE'
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(reportFor(year, method)));
    }),
  );

const taxReportBackendDown = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/tax-report', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

const actingFor = (roleType: RoleType) =>
  userBackend(server, { role: { type: roleType, code: '90000000', name: 'Acme' } });

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

  return history;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  requestedReports.length = 0;
  taxReportBackend();
  investmentAccountBackend();
  actingFor('PERSON');
});

describe('a company looking at a report about personal income tax', () => {
  it('is sent to the account page instead', async () => {
    actingFor('LEGAL_ENTITY');
    const history = initializeComponent();

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('is not asked about on the backend', async () => {
    actingFor('LEGAL_ENTITY');
    const history = initializeComponent();

    await waitFor(() => expect(history.location.pathname).toBe('/account'));
    expect(requestedReports).toHaveLength(0);
  });
});

describe('a tax report the backend never gave', () => {
  it('says so where a screen reader will hear it', async () => {
    taxReportBackendDown();
    initializeComponent();

    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot load your tax report/);
  });

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

describe('a calculation method the backend cannot serve', () => {
  it('leaves the methods on the page so someone can ask for the other one', async () => {
    taxReportBackendRefusingFifo();
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Weighted average' }));

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
    expect(screen.queryByText(/cannot load your tax report/)).not.toBeInTheDocument();
  });

  it('leaves the methods on the page even when the details were closed after choosing one', async () => {
    taxReportBackendRefusingFifoForThisYear();
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Show details' }));
    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(await screen.findAllByText(/74[.,]12/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Hide details' }));
    userEvent.click(screen.getByRole('button', { name: String(thisYear) }));

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FIFO' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Weighted average' }));

    expect(await screen.findByText(/12[.,]34/)).toBeInTheDocument();
    expect(screen.queryByText(/cannot load your tax report/)).not.toBeInTheDocument();
  });

  it('puts the methods on the page when the one nobody chose is the one that fails', async () => {
    taxReportBackendRefusingWeightedAverageForLastYear();
    initializeComponent();

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weighted average' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(await screen.findByText(/74[.,]12/)).toBeInTheDocument();
    expect(screen.queryByText(/cannot load your tax report/)).not.toBeInTheDocument();
  });
});

describe('the calculation method someone can choose', () => {
  it('is on the page while the first report is still being calculated', async () => {
    taxReportBackendStillCalculating();
    initializeComponent();

    expect(screen.getByRole('button', { name: String(lastYear) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: String(thisYear) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weighted average' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FIFO' })).toBeInTheDocument();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
  });
});

describe('the tax report the backend is asked for', () => {
  it('is last year on the weighted average method before anyone chooses', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
    expect(requestedReports).toEqual([{ year: lastYear, method: 'WEIGHTED_AVERAGE' }]);
  });

  it('is the tax year someone chose', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: String(thisYear) }));

    expect(await screen.findByText(/12[.,]34/)).toBeInTheDocument();
    expect(requestedReports[requestedReports.length - 1]).toEqual({
      year: thisYear,
      method: 'WEIGHTED_AVERAGE',
    });
  });

  it('is the calculation method someone chose', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(await screen.findByText(/74[.,]12/)).toBeInTheDocument();
    expect(requestedReports[requestedReports.length - 1]).toEqual({
      year: lastYear,
      method: 'FIFO',
    });
  });
});

describe('the calculation someone opened', () => {
  it('is still open when the other method has been calculated', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Show details' }));

    expect(screen.getByRole('table')).toBeInTheDocument();

    taxReportBackendStillCalculating();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    // Load-bearing placement: the backend is still calculating here, so this catches the
    // weighted average figures being left under the FIFO pill. Awaited after the new
    // figures arrive it would hold either way and guard nothing.
    expect(screen.queryByText(/58[.,]96/)).not.toBeInTheDocument();

    expect(await screen.findAllByText(/74[.,]12/)).not.toHaveLength(0);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weighted average' })).toBeInTheDocument();
    expect(screen.getByText(/405[.,]88/)).toBeInTheDocument();
  });
});

describe('the details someone opened', () => {
  it('leave no button behind when the report they showed is gone', async () => {
    taxReportBackendRefusingThisYear();
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Show details' }));
    userEvent.click(screen.getByRole('button', { name: String(thisYear) }));

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide details' })).not.toBeInTheDocument();
  });
});

describe('the pill someone pressed', () => {
  it('is still where the keyboard left it while another year is being calculated', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    taxReportBackendStillCalculating();

    userEvent.click(screen.getByRole('button', { name: String(thisYear) }));

    expect(screen.getByRole('button', { name: String(thisYear) })).toHaveFocus();

    expect(await screen.findByText(/12[.,]34/)).toBeInTheDocument();
  });

  it('is still where the keyboard left it while another method is being calculated', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Show details' }));

    taxReportBackendStillCalculating();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(screen.getByRole('button', { name: 'FIFO' })).toHaveFocus();

    expect(await screen.findAllByText(/74[.,]12/)).not.toHaveLength(0);
  });

  it('is still where the keyboard left it when a refused first load is replaced by a report', async () => {
    taxReportBackendRefusingWeightedAverageForLastYear();
    initializeComponent();

    expect(await screen.findByText(/cannot load your tax report/)).toBeInTheDocument();

    taxReportBackendStillCalculating();

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(screen.getByRole('button', { name: 'FIFO' })).toHaveFocus();

    expect(await screen.findByText(/74[.,]12/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FIFO' })).toHaveFocus();
  });
});

describe('the tax year and the calculation method someone chose', () => {
  it('are the ones a screen reader is told are pressed', async () => {
    initializeComponent();

    expect(await screen.findByText(/58[.,]96/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: String(lastYear) })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: String(thisYear) })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    userEvent.click(screen.getByRole('button', { name: 'FIFO' }));

    expect(await screen.findByText(/74[.,]12/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FIFO' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Weighted average' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
