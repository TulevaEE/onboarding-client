import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { userBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { Portfolio, RoleType } from '../../common/apiModels';
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

let heldNarrowedPeriods: (() => void)[] = [];

const releaseNarrowedPeriods = () => {
  const held = heldNarrowedPeriods;
  heldNarrowedPeriods = [];
  held.forEach((release) => release());
};

const portfolioBackendHoldingNarrowedPeriods = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', async (req, res, ctx) => {
      if (!req.url.searchParams.get('from')) {
        return res(ctx.json(allTime));
      }
      await new Promise<void>((resolve) => {
        heldNarrowedPeriods.push(resolve);
      });
      return res(ctx.json(lastYear));
    }),
  );

const portfolioRequests: string[] = [];

const portfolioBackendRefusingOutright = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) => {
      portfolioRequests.push(req.url.search);
      return res(ctx.status(400), ctx.json({ errors: [{ code: 'epis.message.exception' }] }));
    }),
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
afterEach(() => {
  releaseNarrowedPeriods();
  server.resetHandlers();
});
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  requestedPeriods.length = 0;
  portfolioRequests.length = 0;
  statementRequests.length = 0;
  portfolioBackend();
  registerHolding([], null);
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

describe('the numbers of a period that is being replaced', () => {
  it('are marked busy, with the old figures inside the busy region, until the new ones arrive', async () => {
    portfolioBackendHoldingNarrowedPeriods();
    initializeComponent();

    expect(await screen.findAllByText(/500[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    await waitFor(() =>
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument(),
    );

    // eslint-disable-next-line testing-library/no-node-access
    const busyRegion = document.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(within(busyRegion).getAllByText(/500[.,]00/)).not.toHaveLength(0);

    releaseNarrowedPeriods();

    expect(await screen.findAllByText(/600[.,]00/)).not.toHaveLength(0);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
});

describe('a period the backend refuses outright', () => {
  it('is not asked for again', async () => {
    portfolioBackendRefusingOutright();
    initializeComponent();

    expect(await screen.findByText(/cannot load fund prices/)).toBeInTheDocument();
    expect(portfolioRequests).toHaveLength(1);
  });
});
