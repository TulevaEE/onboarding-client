import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import { Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  setReturnsData,
  userBackend,
  userCapitalBackend,
  userConversionBackend,
} from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';
import comparisonCalculator from './ComparisonCalculator';
import { ReturnsResponse } from '../ReturnComparison/api';

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

beforeEach(() => {
  initializeConfiguration();
  userBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  returnsBackend(server);
  userCapitalBackend(server);
  applicationsBackend(server);

  initializeComponent();

  history.push('/account');
});

function component() {
  return screen.queryByTestId('comparisonCalculator');
}

async function awaitForInitialData() {
  await waitForElementToBeRemoved(() => screen.queryByTestId('comparisonCalculator-loader'));
}

async function awaitForReturnsData() {
  await waitForElementToBeRemoved(() => screen.queryByTestId('comparisonCalculator-returnLoader'));
}

function timePeriodSelect() {
  return screen.getByTestId('timePeriodSelect');
}

function comparedToSelect() {
  return screen.getByTestId('comparedToSelect');
}

describe('ComparisonCalculator', () => {
  afterEach(() => {
    setReturnsData(undefined);
  });

  test('renders component', async () => {
    const comp = component();
    expect(comp).toBeInTheDocument();

    await awaitForInitialData();
  });

  test('renders time period select', async () => {
    await awaitForInitialData();

    const timeSelect = timePeriodSelect();
    expect(timeSelect).toBeInTheDocument();
    expect(timeSelect).toHaveTextContent('From starting II contributions (March 19, 2004)');
    expect(timeSelect).toHaveTextContent('From Tuleva II pillar fund creation (April 27, 2017)');
    expect(timeSelect).toHaveTextContent('Last 20 years');
    expect(timeSelect).toHaveTextContent('Last 15 years');
    expect(timeSelect).toHaveTextContent('Last 10 years');
    expect(timeSelect).toHaveTextContent('Last 5 years');
    expect(timeSelect).toHaveTextContent('Last 5 years');
    expect(timeSelect).toHaveTextContent('Last 4 years');
    expect(timeSelect).toHaveTextContent('Last 3 years');
    expect(timeSelect).toHaveTextContent('Last 2 years');
    expect(timeSelect).toHaveTextContent('Last year');
  });

  test('renders compare to select', async () => {
    await awaitForInitialData();

    const comparisonSelect = comparedToSelect();
    expect(comparisonSelect).toBeInTheDocument();

    expect(comparisonSelect).toHaveTextContent('World market index');
    expect(comparisonSelect).toHaveTextContent('Estonian II pillar funds average performance');
    expect(comparisonSelect).toHaveTextContent('Estonia inflation rate');
    expect(comparisonSelect).toHaveTextContent('Tuleva World Stocks Pension Fund');
    expect(comparisonSelect).toHaveTextContent('Tuleva World Bonds Pension Fund');
    expect(comparisonSelect).toHaveTextContent('Swedbank Pension Fund K60');
  });

  test('displays too short time period alert', async () => {
    const comp = component();
    expect(comp).toBeInTheDocument();

    await awaitForInitialData();

    setReturnsData(returnsData3YearsAgo);
    userEvent.selectOptions(timePeriodSelect(), 'Last 3 years');
    await awaitForReturnsData();

    await waitFor(() => {
      expect(
        screen.getByText(
          'The comparison period is short. Avoid the temptation to make sudden moves based on short-term fluctuations.',
        ),
      ).toBeInTheDocument();
    });

    setReturnsData(returnsData4YearsAgo);
    userEvent.selectOptions(timePeriodSelect(), 'Last 4 years');
    await awaitForReturnsData();

    await waitFor(() => {
      expect(
        screen.queryByText(
          'The comparison period is short. Avoid the temptation to make sudden moves based on short-term fluctuations.',
        ),
      ).not.toBeInTheDocument();
    });
  });

  test('explanation text with negative performance compared to the index', async () => {
    await awaitForInitialData();

    expect(
      await screen.findByText(/Your II pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/all world market index/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-orange.text-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();

    expect(
      await screen.findByText(
        /follows the world market index, meaning it endeavors to achieve the most similar long-term performance./i,
      ),
    ).toBeInTheDocument();
  });

  test('explanation text with positive performance compared to the index', async () => {
    setReturnsData(returnsDataPositive);
    await awaitForInitialData();

    expect(
      await screen.findByText(/Your II pillar during the past 4 years, when compared to/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/all world market index/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/1 000 €/i, { selector: '.result-positive' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has better performance./i)).toBeInTheDocument();

    expect(
      await screen.findByText(/Tuleva World Stock Pensionfund/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        /follows the world market index, meaning it endeavors to achieve the most similar long-term performance./i,
      ),
    ).toBeInTheDocument();
  });

  test('no CTA button when user is already fully converted', async () => {
    userConversionBackend(server);
    await awaitForInitialData();

    expect(screen.queryByText('Bring your II pillar to Tuleva')).not.toBeInTheDocument();
  });

  test('CTA button when user is not fully converted', async () => {
    userConversionBackend(
      server,
      { transfersComplete: false, selectionComplete: false },
      { transfersComplete: false, selectionComplete: false, paymentComplete: false },
    );
    await awaitForInitialData();

    expect(await screen.findByText(/Bring your II pillar to Tuleva/i)).toBeInTheDocument();
  });
});

const returnsData3YearsAgo: ReturnsResponse = {
  from: moment().subtract(3, 'years').format(),
  returns: [
    {
      key: 'UNION_STOCK_INDEX',
      rate: 0.09,
      amount: 16000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
    {
      key: 'SECOND_PILLAR',
      rate: 0.07,
      amount: 11000.0,
      paymentsSum: 15000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
const returnsData4YearsAgo: ReturnsResponse = {
  from: moment().subtract(4, 'years').format(),
  returns: [
    {
      key: 'UNION_STOCK_INDEX',
      rate: 0.09,
      amount: 16000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
    {
      key: 'SECOND_PILLAR',
      rate: 0.07,
      amount: 11000.0,
      paymentsSum: 15000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
const returnsDataPositive: ReturnsResponse = {
  from: moment().subtract(4, 'years').format(),
  returns: [
    {
      key: 'UNION_STOCK_INDEX',
      rate: 0.09,
      amount: 16000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
    {
      key: 'SECOND_PILLAR',
      rate: 0.1,
      amount: 17000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
