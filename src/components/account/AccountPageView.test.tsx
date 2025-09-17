import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  fundPensionStatusBackend,
  useTestBackendsExcept,
  useTestBackends,
  applicationsBackend,
  userConversionBackend,
} from '../../test/backend';
import {
  Application,
  FundPensionOpeningApplication,
  PartialWithdrawalApplication,
  ThirdPillarWithdrawalApplication,
} from '../common/apiModels';

const server = setupServer();
let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
    // eslint-disable-next-line testing-library/no-node-access,@typescript-eslint/no-non-null-assertion
    const summarySection = screen.getByText('Your asset summary').parentElement!.parentElement!;

    expect(
      await within(summarySection).findByRole('cell', { name: 'Member capital' }),
    ).toBeInTheDocument();
    const getRow = (name: string) =>
      // eslint-disable-next-line testing-library/no-node-access,@typescript-eslint/no-non-null-assertion
      within(summarySection).getByRole('cell', { name }).parentElement!;

    const secondPillarRow = getRow('II pillar');
    expect(within(secondPillarRow).getByText('12 345.67 €')).toBeInTheDocument();
    expect(within(secondPillarRow).queryByText('0.00 €')).not.toBeInTheDocument();
    expect(within(secondPillarRow).getByText('102 654.33 €')).toBeInTheDocument();
    expect(within(secondPillarRow).getByText('115 000.00 €')).toBeInTheDocument();

    const thirdPillarRow = getRow('III pillar');
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
