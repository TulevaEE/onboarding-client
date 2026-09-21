import React from 'react';
import moment from 'moment';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import download from 'downloadjs';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { userBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { Portfolio, RoleType, Transaction } from '../../common/apiModels';
import { SavingsFundStatementSection } from './SavingsFundStatementSection';

jest.mock('downloadjs');
// setupTests pins useIntl to English for the whole suite, which would hide every
// language the CSV is actually written in.
jest.unmock('react-intl');

const today = moment().format('YYYY-MM-DD');

const allTime: Portfolio = {
  from: '2020-01-01',
  to: today,
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
    { date: today, values: { SAVINGS_FUND: 200, SECOND_PILLAR: 300 } },
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

const registerSavingsBalance = (value: number, unavailableValue: number) => ({
  fund: {
    isin: 'EE0000000001',
    name: 'Tuleva Täiendav Kogumisfond',
    fundManager: { name: 'Tuleva' },
    managementFeeRate: 0.0025,
    pillar: null,
    ongoingChargesFigure: 0.0025,
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

const portfolioRefusingNarrowedPeriods = () =>
  server.use(
    rest.get('http://localhost/v1/portfolio', (req, res, ctx) => {
      requestedPeriods.push({
        from: req.url.searchParams.get('from'),
        to: req.url.searchParams.get('to'),
      });
      return req.url.searchParams.get('from')
        ? res(ctx.status(500), ctx.json({}))
        : res(ctx.json(allTime));
    }),
  );

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
  navDate: time.slice(0, 10),
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
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

const accountHoldingNoSavingsFund = () =>
  server.use(rest.get('http://localhost/v1/funds', (req, res, ctx) => res(ctx.json([pillarFund]))));

const accountHoldingUnavailable = () =>
  server.use(
    rest.get('http://localhost/v1/transactions', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

const actingFor = (roleType: RoleType) =>
  userBackend(server, { role: { type: roleType, code: '90000000', name: 'Acme' } });

const actingForThemselves = () => userBackend(server, { role: undefined });

const actingForAChild = () =>
  userBackend(server, { role: { type: 'PERSON', code: '51201011234', name: 'Junior Doe' } });

function initializeComponent(language: 'en' | 'et' = 'en') {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  return renderWrapped(
    <SavingsFundStatementSection />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    language,
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

describe('the savings fund statement', () => {
  const holdingHistory = [
    savingsTransaction('2024-06-01T10:00:00Z', 10, 1.0, 10),
    savingsTransaction('2025-03-10T10:00:00Z', 20, 1.1, 22),
    savingsTransaction('2025-08-01T10:00:00Z', 5, 1.2, -6, 'SUBTRACTION'),
    savingsTransaction('2026-02-01T10:00:00Z', 7, 1.3, 9.1),
  ];

  const justAfterMidnightInTallinn = savingsTransaction('2025-12-31T22:30:00Z', 3, 1.4, 4.2);

  const downloadedCsv = async (): Promise<{ filename: string; text: string }> => {
    const [content, filename] = (download as jest.Mock).mock.calls[0];
    expect(content).toBeInstanceOf(Blob);
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(Buffer.from(reader.result as ArrayBuffer).toString('utf8'));
      reader.readAsArrayBuffer(content);
    });
    return { filename, text };
  };

  it('shows only the transactions of the selected period', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findAllByText(/200[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    // The statement describes the response on screen, so the new period's rows appear
    // only once the new portfolio has rendered — never new dates over old values.
    expect(await screen.findAllByText(/250[.,]00/)).not.toHaveLength(0);
    expect(screen.getAllByText('10.03.2025')).not.toHaveLength(0);
    expect(screen.getAllByText('01.08.2025')).not.toHaveLength(0);
    expect(screen.queryAllByText('01.02.2026')).toHaveLength(0);
  });

  it('dates a transaction by the day it fell on in Estonia', async () => {
    accountHolding([...holdingHistory, justAfterMidnightInTallinn]);
    initializeComponent();

    expect(await screen.findAllByText('01.01.2026')).not.toHaveLength(0);
    expect(screen.queryAllByText('31.12.2025')).toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    const { text } = await downloadedCsv();
    expect(text).toContain('01.01.2026;Contribution;3,0000;1,40000;4,20');
  });

  it('leaves a transaction that crossed midnight in Estonia out of the year before', async () => {
    accountHolding([...holdingHistory, justAfterMidnightInTallinn]);
    initializeComponent();

    expect(await screen.findAllByText(/200[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findAllByText(/250[.,]00/)).not.toHaveLength(0);
    expect(screen.queryAllByText('01.01.2026')).toHaveLength(0);
    expect(screen.queryAllByText(/1[.,]40000/)).toHaveLength(0);
  });

  it('carries the opening and closing units into the printable statement', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findAllByText(/200[.,]00/)).not.toHaveLength(0);

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

    expect(await screen.findAllByText(/200[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));
    expect(await screen.findAllByText(/250[.,]00/)).not.toHaveLength(0);

    userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(download).toHaveBeenCalledTimes(1);
    const { filename, text } = await downloadedCsv();
    expect(filename).toBe('tuleva-kogumisfondi-valjavote-2025-01-01-2025-12-31.csv');
    expect(text).toMatch(/^\ufeffDate;Transaction;Units;NAV;Amount\r\n/);
    expect(text).toContain('10.03.2025;Contribution;20,0000;1,10000;22,00');
    expect(text).toContain('01.08.2025;Redemption;-5,0000;1,20000;-6,00');
    expect(text).not.toContain('01.02.2026');
  });

  it('writes the Estonian CSV in the UTF-8 the byte order mark announces', async () => {
    accountHolding(holdingHistory);
    initializeComponent('et');

    expect(await screen.findByText('Tehingud valitud perioodil')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Laadi alla CSV' }));

    const { text } = await downloadedCsv();
    expect(text).toMatch(/^\ufeffKuupäev;Tehing;Osakud;NAV;Summa\r\n/);
    expect(text).toContain('01.08.2025;Väljamakse;-5,0000;1,20000;-6,00');
  });

  it('opens the print dialog for the PDF', async () => {
    const print = jest.spyOn(window, 'print').mockImplementation(() => {});
    accountHolding(holdingHistory);
    initializeComponent();

    userEvent.click(await screen.findByRole('button', { name: 'Save as PDF' }));

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });

  it('is left out when the transactions never load, rather than claiming an empty period', async () => {
    accountHoldingUnavailable();
    initializeComponent();

    await waitFor(() => expect(screen.getByLabelText('from')).toHaveValue('2020-01-01'));
    expect(
      screen.queryByText('No savings fund transactions in the selected period.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Transactions in the selected period')).not.toBeInTheDocument();
  });

  it('is left out when nothing is held in the savings fund', async () => {
    server.use(
      rest.get('http://localhost/v1/portfolio', (req, res, ctx) => {
        requestedPeriods.push({
          from: req.url.searchParams.get('from'),
          to: req.url.searchParams.get('to'),
        });
        return res(
          ctx.json({
            ...allTime,
            groups: allTime.groups.filter((group) => group.group !== 'SAVINGS_FUND'),
            series: [
              { date: '2020-01-01', values: { SECOND_PILLAR: 100 } },
              { date: today, values: { SECOND_PILLAR: 300 } },
            ],
          }),
        );
      }),
    );
    initializeComponent();

    await waitFor(() => expect(screen.getByLabelText('from')).toHaveValue('2020-01-01'));
    expect(screen.queryByText('Transactions in the selected period')).not.toBeInTheDocument();
  });

  it('is left out when the account holds no savings fund at all', async () => {
    accountHoldingNoSavingsFund();
    initializeComponent();

    await waitFor(() => expect(screen.getByLabelText('from')).toHaveValue('2020-01-01'));

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    await waitFor(() => expect(screen.getByLabelText('from')).toHaveValue('2025-01-01'));
    expect(screen.queryByText('Transactions in the selected period')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No savings fund transactions in the selected period.'),
    ).not.toBeInTheDocument();
  });

  it('closes the statement at what the register holds when the period runs to today', async () => {
    registerHolding([], registerSavingsBalance(300, 50));
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findByText(/350[.,]00/)).toBeInTheDocument();

    const closing = screen.getByRole('row', { name: /Closing balance/ });
    expect(within(closing).getByText(/350[.,]00/)).toBeInTheDocument();

    const change = screen.getByRole('row', { name: /Change in value/ });
    expect(within(change).getByText(/214[.,]90/)).toBeInTheDocument();
  });

  it('says a period could not be served rather than leaving the one before it on screen', async () => {
    portfolioRefusingNarrowedPeriods();
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findByRole('row', { name: /Closing balance/ })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Last year' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Closing balance/ })).not.toBeInTheDocument();
  });

  it('fills the start date with the first day the portfolio covers', async () => {
    accountHolding(holdingHistory);
    initializeComponent();

    expect(await screen.findByRole('row', { name: /Closing balance/ })).toBeInTheDocument();
    expect(screen.getByLabelText('from')).toHaveValue('2020-01-01');
  });

  describe('the printed document', () => {
    it('names the person whose account it is', async () => {
      actingForThemselves();
      accountHolding(holdingHistory);
      initializeComponent();

      expect(await screen.findByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Personal code')).toBeInTheDocument();
      expect(screen.getByText('39001011234')).toBeInTheDocument();
    });

    it('names the company someone is acting for by its registry code', async () => {
      actingFor('LEGAL_ENTITY');
      accountHolding(holdingHistory);
      initializeComponent();

      expect(await screen.findByText('Acme')).toBeInTheDocument();
      expect(screen.getByText('Registry code')).toBeInTheDocument();
      expect(screen.getByText('90000000')).toBeInTheDocument();
      expect(screen.queryByText('Personal code')).not.toBeInTheDocument();
    });

    it('names the child someone is acting for by their personal code', async () => {
      actingForAChild();
      accountHolding(holdingHistory);
      initializeComponent();

      expect(await screen.findByText('Junior Doe')).toBeInTheDocument();
      expect(screen.getByText('Personal code')).toBeInTheDocument();
      expect(screen.getByText('51201011234')).toBeInTheDocument();
    });

    it('names the fund and the period, and what the holding opened and closed at', async () => {
      accountHolding(holdingHistory);
      initializeComponent();

      expect(await screen.findAllByText(/200[.,]00/)).not.toHaveLength(0);

      userEvent.click(screen.getByRole('button', { name: 'Last year' }));

      expect(await screen.findByText('01.01.2025–31.12.2025')).toBeInTheDocument();
      expect(screen.getByText('Tuleva Täiendav Kogumisfond (EE0000000001)')).toBeInTheDocument();
      expect(screen.getAllByText(/120[.,]00/)).not.toHaveLength(0);
      expect(screen.getAllByText(/250[.,]00/)).not.toHaveLength(0);
    });

    it('adds the contributions and the withdrawals of the period up separately', async () => {
      accountHolding(holdingHistory);
      initializeComponent();

      const contributions = await screen.findByRole('row', { name: /Total contributions/ });
      expect(within(contributions).getByText(/41[.,]10/)).toBeInTheDocument();

      const withdrawals = screen.getByRole('row', { name: /Total withdrawals/ });
      expect(within(withdrawals).getByText(/6[.,]00/)).toBeInTheDocument();
    });

    it('carries a running holding and what it was worth onto every transaction row', async () => {
      accountHolding(holdingHistory);
      initializeComponent();

      const secondPurchase = await screen.findByRole('row', {
        name: /10\.03\.2025.*30\.0000/,
      });
      expect(within(secondPurchase).getByText('30.0000')).toBeInTheDocument();
      expect(within(secondPurchase).getByText(/33[.,]00/)).toBeInTheDocument();
    });

    it('shows the change in value the period brought, over and above the money put in', async () => {
      accountHolding(holdingHistory);
      initializeComponent();

      const change = await screen.findByRole('row', { name: /Change in value/ });
      expect(within(change).getByText(/64[.,]90/)).toBeInTheDocument();
    });
  });

  describe('the print flow', () => {
    it('drops the app from the printed page while the statement is on it', async () => {
      accountHolding(holdingHistory);
      initializeComponent();

      expect(await screen.findByText('Transactions in the selected period')).toBeInTheDocument();
      expect(document.body).toHaveClass('printingStatement');
    });

    it('leaves the app on the printed page when there is no statement', async () => {
      accountHoldingUnavailable();
      initializeComponent();

      await waitFor(() => expect(screen.getByLabelText('from')).toHaveValue('2020-01-01'));
      expect(document.body).not.toHaveClass('printingStatement');
    });

    it('gives the app the printed page back once the statement is gone', async () => {
      accountHolding(holdingHistory);
      const { unmount } = initializeComponent();

      expect(await screen.findByText('Transactions in the selected period')).toBeInTheDocument();

      unmount();

      expect(document.body).not.toHaveClass('printingStatement');
    });
  });
});
