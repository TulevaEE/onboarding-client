import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  applicationsBackend,
  fundPensionStatusBackend,
  pensionAccountStatementBackend,
  thirdPillarRecurringPaymentBackend,
  userConversionBackend,
  useTestBackends,
  useTestBackendsExcept,
} from '../../test/backend';
import {
  Application,
  FundBalance,
  FundPensionOpeningApplication,
  PartialWithdrawalApplication,
  ThirdPillarWithdrawalApplication,
} from '../common/apiModels';
import {
  activeSecondPillarBalance,
  additionalSavingsFund,
  tulevaThirdPillarBalance,
} from './statusBox/fixtures';

const server = setupServer();
let history: History;

function initializeComponent(queryClient?: QueryClient) {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store, queryClient);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  server.use(savingsFundOnboardingStatus.notStarted());
  server.use(savingsAccountStatement.zero());
});

const getStatusBoxRow = async (type: 'SECOND' | 'THIRD' | 'MEMBER') => {
  const rows = await screen.findAllByTestId('status-box-row');

  const rowOrder = ['SECOND', 'THIRD', 'MEMBER'] as const;
  const rowIndex = rowOrder.indexOf(type);

  return rows[rowIndex];
};

const getWithdrawalsLink = async () => screen.queryByRole('link', { name: 'Withdrawals' });

describe('happy path', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    initializeComponent();

    history.push('/account');
  });

  test('user data is shown', async () => {
    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('55667788')).toBeInTheDocument();
  });

  test('shows capital listings link and count', async () => {
    const count = await screen.findByTestId('member-capital-listings-count');
    expect(await within(count).findByText('3')).toBeInTheDocument();

    const link = await screen.findByRole('link', { name: /Buy-sell/ });
    expect(link).toBeInTheDocument();
    userEvent.click(link);

    expect(history.location.pathname).toBe('/capital/listings');
  });

  test('pension summary table is shown', async () => {
    /* eslint-disable testing-library/no-node-access,@typescript-eslint/no-non-null-assertion */
    const summarySection = (await screen.findByText('Your asset summary')).parentElement!
      .parentElement!;
    /* eslint-enable testing-library/no-node-access,@typescript-eslint/no-non-null-assertion */

    expect(
      await within(summarySection).findByRole('cell', { name: 'Member capital' }),
    ).toBeInTheDocument();
    const getRow = (name: string | RegExp) =>
      // eslint-disable-next-line testing-library/no-node-access,@typescript-eslint/no-non-null-assertion
      within(summarySection).getByRole('cell', { name }).parentElement!;

    const secondPillarRow = getRow(/^II\spillar$/);
    expect(within(secondPillarRow).getByText('12 345.67 €')).toBeInTheDocument();
    expect(within(secondPillarRow).queryByText('0.00 €')).not.toBeInTheDocument();
    expect(within(secondPillarRow).getByText('102 654.33 €')).toBeInTheDocument();
    expect(within(secondPillarRow).getByText('115 000.00 €')).toBeInTheDocument();

    const thirdPillarRow = getRow(/^III\spillar$/);
    expect(within(thirdPillarRow).getByText('9 876.54 €')).toBeInTheDocument();
    expect(within(thirdPillarRow).queryByText('0.00 €')).not.toBeInTheDocument();
    expect(within(thirdPillarRow).getByText('−4 177.18 €')).toBeInTheDocument();
    expect(within(thirdPillarRow).getByText('5 699.36 €')).toBeInTheDocument();

    const memberCapitalRow = getRow('Member capital');
    expect(within(memberCapitalRow).getByText('1 001.23 €')).toBeInTheDocument();
    expect(within(memberCapitalRow).queryByText('0.00 €')).not.toBeInTheDocument();
    expect(within(memberCapitalRow).getByText('−123.45 €')).toBeInTheDocument();
    expect(within(memberCapitalRow).getByText('877.78 €')).toBeInTheDocument();

    const totalRow = getRow('Total');
    expect(within(totalRow).getByText('23 223.44 €')).toBeInTheDocument();
    expect(within(totalRow).queryByText('0.00 €')).not.toBeInTheDocument();
    expect(within(totalRow).getByText('98 353.70 €')).toBeInTheDocument();
    expect(within(totalRow).getByText('121 577.14 €')).toBeInTheDocument();
  });

  test('shows PIK account with bank name in account statement', async () => {
    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(await screen.findByText('Swedbank PIK')).toBeInTheDocument();
  });
});

describe('third pillar paid in without a fund selection', () => {
  const renderAccountWith = (fundBalances: FundBalance[]) => {
    useTestBackendsExcept(server, ['pensionAccountStatement']);
    pensionAccountStatementBackend(server, fundBalances);
    initializeComponent();

    history.push('/account');
  };

  beforeEach(() => {
    initializeConfiguration();
  });

  test('shows the finish-choosing warning with a call to action', async () => {
    renderAccountWith([
      activeSecondPillarBalance,
      { ...tulevaThirdPillarBalance, activeContributions: false },
    ]);

    const thirdPillarRow = await getStatusBoxRow('THIRD');

    expect(
      await within(thirdPillarRow).findByText(/haven’t chosen a fund yet/),
    ).toBeInTheDocument();
    expect(await within(thirdPillarRow).findByTestId('status-icon-warning')).toBeInTheDocument();
    expect(within(thirdPillarRow).getByRole('link', { name: 'Choose fund' })).toBeInTheDocument();
  });

  test('does not warn when a fund is actively selected', async () => {
    renderAccountWith([activeSecondPillarBalance, tulevaThirdPillarBalance]);

    const thirdPillarRow = await getStatusBoxRow('THIRD');
    expect(await within(thirdPillarRow).findByRole('link')).toBeInTheDocument();

    expect(within(thirdPillarRow).queryByText(/haven’t chosen a fund yet/)).not.toBeInTheDocument();
  });
});

describe('fund pension status', () => {
  beforeEach(() => {
    initializeConfiguration();

    useTestBackendsExcept(server, ['fundPensionStatus']);

    fundPensionStatusBackend(server, {
      fundPensions: [
        {
          pillar: 'SECOND',
          startDate: '2019-10-01T12:13:27.141Z',
          endDate: null,
          active: true,
          durationYears: 20,
        },
        {
          pillar: 'THIRD',
          startDate: '2018-10-01T12:13:27.141Z',
          endDate: null,
          active: true,
          durationYears: 15,
        },
      ],
    });

    initializeComponent();

    history.push('/account');
  });

  test("active fund pension information is shown and withdrawals isn't shown", async () => {
    expect(
      await screen.findByText(
        'Contributions have ended and you are receiving regular fund pension payments',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('You are receiving regular fund pension payments'),
    ).toBeInTheDocument();

    expect(await screen.findByText('October 2039')).toBeInTheDocument();
    expect(await screen.findByText('October 2033')).toBeInTheDocument();

    expect(await getWithdrawalsLink()).not.toBeInTheDocument();
  });
});

describe('pending withdrawal transactions', () => {
  const secondPillarPartialWithdrawalApplication: PartialWithdrawalApplication = {
    id: 124,
    creationTime: '2024-12-01T01:23:45Z',
    status: 'PENDING',
    details: {
      depositAccountIBAN: 'EE_TEST_IBAN',
      cancellationDeadline: '2025-01-20T21:59:59.999999999Z',
      fulfillmentDate: '2025-01-20',
    },
    type: 'PARTIAL_WITHDRAWAL',
  };

  const thirdPillarWithdrawalApplication: ThirdPillarWithdrawalApplication = {
    id: 125,
    creationTime: '2024-12-01T01:23:45Z',
    status: 'PENDING',
    details: {
      depositAccountIBAN: 'EE_TEST_IBAN',
      cancellationDeadline: null,
      fulfillmentDate: '2024-12-05',
    },
    type: 'WITHDRAWAL_THIRD_PILLAR',
  };

  const secondPillarFundPensionOpeningApplication: FundPensionOpeningApplication = {
    id: 126,
    creationTime: '2024-12-02T01:23:45Z',
    status: 'PENDING',
    details: {
      depositAccountIBAN: 'EE_TEST_IBAN',
      cancellationDeadline: '2025-01-15T21:59:59.999999999Z',
      fulfillmentDate: '2025-01-20',
      fundPensionDetails: {
        durationYears: 20,
        paymentsPerYear: 12,
      },
    },
    type: 'FUND_PENSION_OPENING',
  };

  const thirdPillarFundPensionOpeningApplication: FundPensionOpeningApplication = {
    id: 127,
    creationTime: '2024-12-02T01:23:45Z',
    status: 'PENDING',
    details: {
      depositAccountIBAN: 'EE_TEST_IBAN',
      cancellationDeadline: '2025-01-15T21:59:59.999999999Z',
      fulfillmentDate: '2025-01-20',
      fundPensionDetails: {
        durationYears: 20,
        paymentsPerYear: 12,
      },
    },
    type: 'FUND_PENSION_OPENING_THIRD_PILLAR',
  };

  beforeEach(() => {
    initializeConfiguration();
  });

  const initializeApplicationsAndComponent = (applications: Application[]) => {
    useTestBackendsExcept(server, ['applications', 'userConversion']);
    applicationsBackend(server, applications);

    userConversionBackend(
      server,
      {
        pendingWithdrawal: true,
      },
      { pendingWithdrawal: true },
    );

    initializeComponent();

    history.push('/account');
  };

  test("pending withdrawal and fund pension application info is shown and withdrawals link isn't shown", async () => {
    initializeApplicationsAndComponent([
      secondPillarPartialWithdrawalApplication,
      thirdPillarWithdrawalApplication,
      secondPillarFundPensionOpeningApplication,
      thirdPillarFundPensionOpeningApplication,
    ]);

    expect(
      await screen.findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();
    const secondPillarRow = await getStatusBoxRow('SECOND');
    const thirdPillarRow = await getStatusBoxRow('THIRD');

    expect(
      await within(secondPillarRow).findByText(
        'You have a pending fund pension application for regular payments and a pending partial withdrawal application',
      ),
    ).toBeInTheDocument();
    expect(await within(secondPillarRow).findByTestId('status-icon-warning')).toBeInTheDocument();

    expect(
      await within(secondPillarRow).findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();

    expect(
      await within(thirdPillarRow).findByText(
        'You have a pending fund pension application for regular payments and a pending partial withdrawal application',
      ),
    ).toBeInTheDocument();
    expect(await within(thirdPillarRow).findByTestId('status-icon-success')).toBeInTheDocument();

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });

  test('pending withdrawal info is shown', async () => {
    initializeApplicationsAndComponent([
      secondPillarPartialWithdrawalApplication,
      thirdPillarWithdrawalApplication,
    ]);

    expect(
      await screen.findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();
    const secondPillarRow = await getStatusBoxRow('SECOND');
    const thirdPillarRow = await getStatusBoxRow('THIRD');

    expect(
      await within(secondPillarRow).findByText('You have a pending partial withdrawal application'),
    ).toBeInTheDocument();

    expect(await within(secondPillarRow).findByTestId('status-icon-warning')).toBeInTheDocument();

    expect(
      await within(secondPillarRow).findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();

    expect(
      await within(thirdPillarRow).findByText('You have a pending partial withdrawal application'),
    ).toBeInTheDocument();
    expect(await within(thirdPillarRow).findByTestId('status-icon-success')).toBeInTheDocument();

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });

  test('fund pension opening info is shown', async () => {
    initializeApplicationsAndComponent([
      secondPillarFundPensionOpeningApplication,
      thirdPillarFundPensionOpeningApplication,
    ]);

    expect(
      await screen.findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();
    const secondPillarRow = await getStatusBoxRow('SECOND');
    const thirdPillarRow = await getStatusBoxRow('THIRD');

    expect(
      await within(secondPillarRow).findByText(
        'You have a pending fund pension application for regular payments',
      ),
    ).toBeInTheDocument();
    expect(await within(secondPillarRow).findByTestId('status-icon-warning')).toBeInTheDocument();

    expect(
      await within(secondPillarRow).findByText('on August 1 your II pillar contributions will end'),
    ).toBeInTheDocument();

    expect(
      await within(thirdPillarRow).findByText(
        'You have a pending fund pension application for regular payments',
      ),
    ).toBeInTheDocument();

    expect(await within(thirdPillarRow).findByTestId('status-icon-success')).toBeInTheDocument();

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });
});

describe('withdrawals link', () => {
  beforeEach(() => {
    initializeConfiguration();

    useTestBackendsExcept(server, ['fundPensionStatus', 'userConversion', 'applications']);
  });

  test('shows withdrawals link when no withdrawals and fund pensions active', async () => {
    fundPensionStatusBackend(server, {
      fundPensions: [],
    });
    applicationsBackend(server);
    userConversionBackend(
      server,
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
    );

    initializeComponent();

    history.push('/account');

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).toBeInTheDocument();
    });
  });

  test('when second pillar fund pension is active with both pillars present, it does not show withdrawals link', async () => {
    fundPensionStatusBackend(server, {
      fundPensions: [
        {
          pillar: 'SECOND',
          startDate: '2019-10-01T12:13:27.141Z',
          endDate: null,
          active: true,
          durationYears: 20,
        },
      ],
    });
    applicationsBackend(server);
    userConversionBackend(
      server,
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
    );

    initializeComponent();

    history.push('/account');

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });

  test('when second pillar fund pension is active with only second pillar present, it does not show withdrawals link', async () => {
    fundPensionStatusBackend(server, {
      fundPensions: [
        {
          pillar: 'SECOND',
          startDate: '2019-10-01T12:13:27.141Z',
          endDate: null,
          active: true,
          durationYears: 20,
        },
      ],
    });
    applicationsBackend(server);
    userConversionBackend(
      server,
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
      {
        selectionComplete: false,
        paymentComplete: false,
        pendingWithdrawal: false,
      },
    );

    initializeComponent();

    history.push('/account');

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });

  test('when third pillar fund pension is active with both pillars present, it does not show withdrawals link', async () => {
    fundPensionStatusBackend(server, {
      fundPensions: [
        {
          pillar: 'THIRD',
          startDate: '2019-10-01T12:13:27.141Z',
          endDate: null,
          active: true,
          durationYears: 20,
        },
      ],
    });
    applicationsBackend(server);
    userConversionBackend(
      server,
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
      {
        selectionComplete: true,
        paymentComplete: true,
        pendingWithdrawal: false,
      },
    );

    initializeComponent();

    history.push('/account');

    await waitFor(async () => {
      expect(await getWithdrawalsLink()).not.toBeInTheDocument();
    });
  });
});

describe('Additional Investment Fund status', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
  });

  it('shows start investing when user has not started onboarding', async () => {
    server.use(savingsFundOnboardingStatus.notStarted());
    server.use(savingsAccountStatement.zero());

    initializeComponent();
    history.push('/account');

    await waitFor(async () => {
      const rows = await screen.findAllByTestId('status-box-row');
      expect(rows).toHaveLength(4);
    });

    const savingsFundRow = screen.getAllByTestId('status-box-row')[2];

    expect(
      within(savingsFundRow).getByRole('heading', { name: 'Additional Investment Fund' }),
    ).toBeInTheDocument();
    expect(
      within(savingsFundRow).getByRole('link', { name: 'Start investing' }),
    ).toBeInTheDocument();
  });

  it('shows status when onboarding is completed', async () => {
    server.use(savingsFundOnboardingStatus.completed());
    server.use(savingsAccountStatement.zero());

    initializeComponent();
    history.push('/account');

    // We fetch Additional Investment Fund with react-query, so we need to wait for it to appear
    await waitFor(async () => {
      const rows = await screen.findAllByTestId('status-box-row');
      expect(rows).toHaveLength(4);
    });

    const savingsFundRow = screen.getAllByTestId('status-box-row')[2];

    expect(within(savingsFundRow).getByTestId('status-icon-todo')).toBeInTheDocument();
    expect(
      within(savingsFundRow).getByRole('heading', { name: 'Additional Investment Fund' }),
    ).toBeInTheDocument();
    expect(
      within(savingsFundRow).getByText(
        'A widely diversified index fund that invests in the global stock market',
      ),
    ).toBeInTheDocument();
    expect(
      within(savingsFundRow).getByRole('link', { name: 'Make a payment' }),
    ).toBeInTheDocument();
  });

  it('shows what the investment is worth, counting units reserved for a pending withdrawal, rather than what was paid in', async () => {
    server.use(savingsFundOnboardingStatus.completed());
    server.use(savingsAccountStatement.partlyWithdrawnWithPendingWithdrawal());

    initializeComponent();
    history.push('/account');

    // We fetch Additional Investment Fund with react-query, so we need to wait for it to appear
    await waitFor(async () => {
      const rows = await screen.findAllByTestId('status-box-row');
      expect(rows).toHaveLength(4);
    });

    const savingsFundRow = screen.getAllByTestId('status-box-row')[2];

    expect(
      within(savingsFundRow).getByRole('heading', { name: 'Additional Investment Fund' }),
    ).toBeInTheDocument();
    expect(
      within(savingsFundRow).getByText('You are investing in Tuleva low cost index fund'),
    ).toBeInTheDocument();
    expect(within(savingsFundRow).getByTestId('status-icon-success')).toBeInTheDocument();
    expect(within(savingsFundRow).getByText('Your investment is worth')).toBeInTheDocument();
    expect(within(savingsFundRow).getByText('200.00 €')).toBeInTheDocument();
    expect(within(savingsFundRow).queryByText('300.00 €')).not.toBeInTheDocument();
  });

  it('keeps showing what the investment is worth while every unit is reserved for a pending withdrawal', async () => {
    server.use(savingsFundOnboardingStatus.completed());
    server.use(savingsAccountStatement.fullyReservedForPendingWithdrawal());

    initializeComponent();
    history.push('/account');

    await waitFor(async () => {
      const rows = await screen.findAllByTestId('status-box-row');
      expect(rows).toHaveLength(4);
    });

    const savingsFundRow = screen.getAllByTestId('status-box-row')[2];

    expect(within(savingsFundRow).getByTestId('status-icon-success')).toBeInTheDocument();
    expect(within(savingsFundRow).getByText('Your investment is worth')).toBeInTheDocument();
    expect(within(savingsFundRow).getByText('200.00 €')).toBeInTheDocument();
  });

  it('still offers the account chooser once the member has completed their own onboarding', async () => {
    server.use(savingsFundOnboardingStatus.completed());
    server.use(savingsAccountStatement.zero());

    initializeComponent();
    history.push('/account');

    /* eslint-disable testing-library/no-node-access,@typescript-eslint/no-non-null-assertion */
    const savingsFundActions = (await screen.findByRole('link', { name: 'Deposit' }))
      .parentElement!;
    /* eslint-enable testing-library/no-node-access,@typescript-eslint/no-non-null-assertion */

    expect(
      within(savingsFundActions).getByRole('link', { name: 'Open a new account' }),
    ).toHaveAttribute('href', '/savings-fund/onboarding');

    const savingsFundRow = screen.getAllByTestId('status-box-row')[2];
    expect(
      within(savingsFundRow).getByRole('link', { name: 'Make a payment' }),
    ).toBeInTheDocument();
  });
});

describe('third pillar recurring payment link', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['thirdPillarRecurringPayment']);
  });

  const renderAccountPage = (queryClient?: QueryClient) => {
    initializeComponent(queryClient);
    history.push('/account');
  };

  const recurringPaymentLink = () =>
    screen.queryByRole('link', { name: 'Change recurring payment' });

  const linkBefore = (link: HTMLElement) => {
    const links = screen.getAllByRole('link');
    return links[links.indexOf(link) - 1];
  };

  test('sits after the payment link in the III pillar section when a standing order is detected', async () => {
    thirdPillarRecurringPaymentBackend(server, { detected: true });
    renderAccountPage();

    const link = await screen.findByRole('link', { name: 'Change recurring payment' });

    expect(linkBefore(link)).toHaveAccessibleName('Make a payment');
    expect(linkBefore(link)).toHaveClass('icon-link');
    expect(link).toHaveAttribute('href', '/3rd-pillar-recurring-payment');
    expect(link).toHaveClass('icon-link');
  });

  test('takes the person to the recurring payment change flow', async () => {
    thirdPillarRecurringPaymentBackend(server, { detected: true });
    renderAccountPage();

    userEvent.click(await screen.findByRole('link', { name: 'Change recurring payment' }));

    expect(history.location.pathname).toBe('/3rd-pillar-recurring-payment');
  });

  test('is not shown when no standing order is detected', async () => {
    const requests = thirdPillarRecurringPaymentBackend(server, { detected: false });
    renderAccountPage();

    await waitFor(() => expect(requests.count()).toBe(1));
    expect(await screen.findByText('Swedbank PIK')).toBeInTheDocument();
    expect(recurringPaymentLink()).not.toBeInTheDocument();
  });

  test('appears only once the detection has answered', async () => {
    let answer = () => {};
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    server.use(
      rest.get('http://localhost/v1/me/third-pillar/recurring-payment', async (req, res, ctx) => {
        await answered;
        return res(ctx.json({ detected: true }));
      }),
    );
    renderAccountPage();

    expect(await screen.findByText('Swedbank PIK')).toBeInTheDocument();
    expect(recurringPaymentLink()).not.toBeInTheDocument();

    answer();

    expect(
      await screen.findByRole('link', { name: 'Change recurring payment' }),
    ).toBeInTheDocument();
  });

  test('is not shown when the detection fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let requests = 0;
    server.use(
      rest.get('http://localhost/v1/me/third-pillar/recurring-payment', (req, res, ctx) => {
        requests += 1;
        return res(ctx.status(500), ctx.json({ errors: [] }));
      }),
    );
    renderAccountPage(queryClient);

    expect(await screen.findByText('Swedbank PIK')).toBeInTheDocument();
    await waitFor(() => expect(requests).toBe(1));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(recurringPaymentLink()).not.toBeInTheDocument();
  });
});

const savingsFundOnboardingStatus = {
  completed: () =>
    rest.get('/v1/savings/onboarding/status', (req, res, ctx) =>
      res(ctx.json({ status: 'COMPLETED' })),
    ),
  notStarted: () =>
    rest.get('/v1/savings/onboarding/status', (req, res, ctx) => res(ctx.json({ status: null }))),
};

const savingsAccountStatement = {
  zero: () =>
    rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
      res(ctx.json({ ...additionalSavingsFund, value: 0, contributions: 0 })),
    ),
  partlyWithdrawnWithPendingWithdrawal: () =>
    rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
      res(
        ctx.json({
          ...additionalSavingsFund,
          value: 150,
          unavailableValue: 50,
          units: 150,
          contributions: 300,
          subtractions: -200,
          profit: 100,
        }),
      ),
    ),
  fullyReservedForPendingWithdrawal: () =>
    rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
      res(
        ctx.json({
          ...additionalSavingsFund,
          value: 0,
          unavailableValue: 200,
          units: 0,
          contributions: 300,
          subtractions: -100,
          profit: 0,
        }),
      ),
    ),
};
