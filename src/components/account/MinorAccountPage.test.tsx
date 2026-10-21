import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { mockMinor } from '../../test/backend-responses';
import {
  neverAnswer,
  pensionAccountStatementBackend,
  savingsAccountStatementBackend,
  transactionsBackend,
  useTestBackendsExcept,
  userBackend,
} from '../../test/backend';
import {
  depositFromMinorsOwnAccount,
  depositFromParent,
  subtraction,
} from './TransactionSection/fixtures';
import { additionalSavingsFund, tulevaThirdPillarBalance } from './statusBox/fixtures';
import { PII_CLASS } from '../tracking/piiMarkup';
import { useSavingsFundBalanceOrFail, useSourceFunds } from '../common/apiHooks';

const server = setupServer();

const minorsSavings = {
  ...additionalSavingsFund,
  value: 1193.9,
  contributions: 1175,
  profit: 18.9,
  units: 1144.122,
};

const minorsThirdPillar = {
  ...tulevaThirdPillarBalance,
  value: 312.5,
  contributions: 300,
  profit: 12.5,
  units: 312.5 / 0.7813,
};

const PORTFOLIO_FETCHED = 'portfolio fetched';

const PortfolioFetched = () => {
  const savingsFundBalance = useSavingsFundBalanceOrFail();
  const sourceFunds = useSourceFunds();
  return savingsFundBalance.isFetched && sourceFunds.isFetched ? <p>{PORTFOLIO_FETCHED}</p> : null;
};

function openAccountPage(queryClient = new QueryClient()) {
  const history = createMemoryHistory();
  const store = createDefaultStore(history);
  login(store);
  renderWrapped(
    <>
      <Route path="" component={LoggedInApp} />
      <PortfolioFetched />
    </>,
    history,
    store,
    queryClient,
  );
  history.push('/account');
}

const queryObserversNotified = () => new Promise((resolve) => setTimeout(resolve, 0));

const withoutRetries = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const failingRequest = (url: string) =>
  rest.get(url, (_req, res, ctx) => res(ctx.status(500), ctx.json({ errors: [] })));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['user']);
  userBackend(server, mockMinor);
  savingsAccountStatementBackend(server, minorsSavings);
  pensionAccountStatementBackend(server, [minorsThirdPillar]);
  transactionsBackend(server, [depositFromParent, depositFromMinorsOwnAccount, subtraction]);
});

describe('MinorAccountPage', () => {
  beforeEach(() => {
    openAccountPage();
  });

  test('greets them by their first name', async () => {
    expect(await screen.findByText('Hi, Mari!')).toBeInTheDocument();
  });

  test('marks the greeting that names them as personal data for analytics', async () => {
    expect(await screen.findByText('Hi, Mari!')).toHaveClass(PII_CLASS);
  });

  test('tells them a parent makes the transactions until they turn 18', async () => {
    expect(
      await screen.findByText(/^Your parent opened this account for you.*Until you turn\s18/),
    ).toBeInTheDocument();
  });

  test('sets the page title to their account', async () => {
    expect(await screen.findByText('Hi, Mari!')).toBeInTheDocument();
    expect(document.title).toBe('My account – Tuleva');
  });

  test('heads their holdings as an overview of their portfolio', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Your portfolio overview', level: 2 }),
    ).toBeInTheDocument();
  });

  test('shows their savings fund balance and profit', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Additional Investment Fund', level: 3 }),
    ).toBeInTheDocument();
    const savingsFundRow = await screen.findByRole('row', {
      name: /^Tuleva Täiendav Kogumisfond/,
    });
    expect(within(savingsFundRow).getByText(/^18\.90\s€$/)).toBeInTheDocument();
    expect(within(savingsFundRow).getByText(/^1\s193\.90\s€$/)).toBeInTheDocument();
  });

  test('shows their III pillar holdings and profit', async () => {
    expect(
      await screen.findByRole('heading', { name: /^III\spillar$/, level: 3 }),
    ).toBeInTheDocument();
    const thirdPillarRow = await screen.findByRole('row', {
      name: /^Tuleva III Samba Pensionifond/,
    });
    expect(within(thirdPillarRow).getByText(/^12\.50\s€$/)).toBeInTheDocument();
  });

  test('explains who can deposit and withdraw instead of linking to either', async () => {
    expect(await screen.findByRole('button', { name: 'Deposit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Deposit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Withdraw' })).not.toBeInTheDocument();
  });

  test('says that their parent makes the deposits when asked', async () => {
    userEvent.click(await screen.findByRole('button', { name: 'Deposit' }));

    expect(
      screen.getByText('Your parent can make deposits from their own bank account or yours.'),
    ).toBeVisible();
  });

  test('says that withdrawals only go to their own bank account when asked', async () => {
    userEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    expect(
      screen.getByText('Your parent can make withdrawals, and only to your own bank account.'),
    ).toBeVisible();
  });

  test('lists their latest savings fund transactions and who paid them', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Your latest transactions', level: 2 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'From' })).toBeInTheDocument();
    expect(screen.getByText('Kati Kask')).toBeInTheDocument();
    expect(screen.getByText('Your bank account')).toBeInTheDocument();
  });

  test('leaves other pillars out of the latest transactions', async () => {
    expect(await screen.findByText('Kati Kask')).toBeInTheDocument();
    expect(screen.queryByText(/^−100\.00\s€$/)).not.toBeInTheDocument();
  });

  test('links to all their savings fund transactions', async () => {
    expect(await screen.findByRole('link', { name: 'View all transactions' })).toHaveAttribute(
      'href',
      '/savings-fund-transactions',
    );
  });

  test('offers nothing to act on but the list of all transactions', async () => {
    expect(await screen.findByText('Kati Kask')).toBeInTheDocument();
    expect(
      within(screen.getByRole('main'))
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['View all transactions']);
  });
});

describe('MinorAccountPage without III pillar holdings', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server, []);
    openAccountPage();
  });

  test('leaves the III pillar out without an alert', async () => {
    expect(await screen.findByText(PORTFOLIO_FETCHED)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Additional Investment Fund', level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^III\spillar$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('MinorAccountPage without a savings fund account', () => {
  beforeEach(() => {
    server.use(
      rest.get('http://localhost/v1/savings-account-statement', (_req, res, ctx) =>
        res(ctx.status(204)),
      ),
    );
    openAccountPage(withoutRetries());
  });

  test('does not take the missing account for a failure', async () => {
    expect(await screen.findByText(PORTFOLIO_FETCHED)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('leaves the savings fund section out and shows the III pillar', async () => {
    expect(await screen.findByText(PORTFOLIO_FETCHED)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /^III\spillar$/, level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Additional Investment Fund' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deposit' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).not.toBeInTheDocument();
  });
});

describe('MinorAccountPage while the savings balance is loading', () => {
  beforeEach(() => {
    server.use(rest.get('http://localhost/v1/savings-account-statement', neverAnswer));
    openAccountPage();
  });

  test('shows a shimmer in place of an empty savings table', async () => {
    expect(await screen.findByText('Hi, Mari!')).toBeInTheDocument();
    expect(await screen.findByTestId('account-statement-loader')).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).not.toBeInTheDocument();
  });
});

describe('MinorAccountPage when a later refresh of the savings fund balance fails', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = withoutRetries();
    openAccountPage(queryClient);
  });

  test('keeps showing the balance it already has instead of the alert', async () => {
    expect(
      await screen.findByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).toBeInTheDocument();

    server.use(failingRequest('http://localhost/v1/savings-account-statement'));
    await act(async () => {
      await queryClient.refetchQueries(['savingsFundBalance']);
      await queryObserversNotified();
    });

    expect(screen.getByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('MinorAccountPage when the savings fund balance cannot be loaded', () => {
  beforeEach(() => {
    server.use(failingRequest('http://localhost/v1/savings-account-statement'));
    openAccountPage(withoutRetries());
  });

  test('says the portfolio could not be loaded instead of showing an empty savings fund', async () => {
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We cannot load your portfolio right now.',
    );
    expect(
      screen.queryByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^0\.00\s€$/)).not.toBeInTheDocument();
  });

  test('loads the portfolio again when asked', async () => {
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    savingsAccountStatementBackend(server, minorsSavings);
    userEvent.click(tryAgain);

    expect(
      await screen.findByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('MinorAccountPage when the III pillar holdings cannot be loaded', () => {
  beforeEach(() => {
    server.use(failingRequest('http://localhost/v1/pension-account-statement'));
    openAccountPage(withoutRetries());
  });

  test('says the portfolio could not be loaded and still shows the savings fund', async () => {
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We cannot load your portfolio right now.',
    );
    expect(
      await screen.findByRole('row', { name: /^Tuleva Täiendav Kogumisfond/ }),
    ).toBeInTheDocument();
  });

  test('loads the III pillar again when asked', async () => {
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    pensionAccountStatementBackend(server, [minorsThirdPillar]);
    userEvent.click(tryAgain);

    expect(
      await screen.findByRole('heading', { name: /^III\spillar$/, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
