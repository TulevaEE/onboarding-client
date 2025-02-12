import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
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
import { ReturnsResponse } from './api';

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

const userBackendOverrides = {};
beforeEach(() => {
  initializeConfiguration();
  // userBackend(server, userBackendOverrides);
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
  return screen.getByRole('region', { name: 'Comparison Calculator' });
}

function queryComponent() {
  return screen.queryByRole('region', { name: 'Comparison Calculator' });
}

async function awaitForInitialData() {
  const loader = screen.queryByRole('progressbar', { name: /Loading Comparison Calculator.../i });
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }
}

async function awaitForReturnsData() {
  const loader = screen.queryByRole('progressbar', { name: /Loading comparison.../i });
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }
}

function timePeriodSelect() {
  return screen.getByRole('combobox', { name: /time period/i });
}

function findTimePeriodSelect() {
  return screen.findByRole('combobox', { name: /time period/i });
}

function comparedToSelect() {
  return screen.getByRole('combobox', { name: /compared to/i });
}

function graphSection() {
  return screen.getByRole('figure', { name: 'Comparison Calculator Figure' });
}

async function checkForExplanationSubtext() {
  expect(
    await screen.findByText(/Tuleva stock funds/i, { selector: 'strong' }),
  ).toBeInTheDocument();

  expect(
    await screen.findByText(
      /follow the world market index, meaning they endeavor to achieve the most similar long-term performance./i,
    ),
  ).toBeInTheDocument();
}

function pillar3button() {
  return screen.getByRole('button', { name: /Your III pillar/i });
}

async function expectAllWorldMarketInBold() {
  expect(
    await screen.findByText(/all world market index/i, { selector: 'strong' }),
  ).toBeInTheDocument();
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

  test('renders pillar selection', async () => {
    userBackend(server);
    await awaitForInitialData();

    const secondPillarButton = within(component()).getByRole('button', { name: 'Your II pillar' });
    const thirdPillarButton = within(component()).getByRole('button', { name: 'Your III pillar' });

    expect(secondPillarButton).toBeInTheDocument();
    expect(thirdPillarButton).toBeInTheDocument();

    expect(secondPillarButton).toHaveClass('btn-primary');
    expect(thirdPillarButton).toHaveClass('btn-light');
  });

  test('does not render pillar selection when user has only second pillar', async () => {
    userBackend(server, { thirdPillarActive: true, secondPillarActive: false });
    await awaitForInitialData();

    const secondPillarButton = within(component()).queryByRole('button', {
      name: 'Your II pillar',
    });
    const thirdPillarButton = within(component()).queryByRole('button', {
      name: 'Your III pillar',
    });

    expect(secondPillarButton).not.toBeInTheDocument();
    expect(thirdPillarButton).not.toBeInTheDocument();
  });

  test('does not render pillar selection when user has only second pillar', async () => {
    userBackend(server, { thirdPillarActive: false, secondPillarActive: true });
    await awaitForInitialData();

    const secondPillarButton = within(component()).queryByRole('button', {
      name: 'Your II pillar',
    });
    const thirdPillarButton = within(component()).queryByRole('button', {
      name: 'Your III pillar',
    });

    expect(secondPillarButton).not.toBeInTheDocument();
    expect(thirdPillarButton).not.toBeInTheDocument();
  });

  test('does not render component when user does not have active II or III pillar', async () => {
    userBackend(server, { thirdPillarActive: false, secondPillarActive: false });
    await awaitForInitialData();
    expect(queryComponent()).not.toBeInTheDocument();
  });

  test('renders 2nd pillar time period select', async () => {
    await awaitForInitialData();

    const timeSelect = timePeriodSelect();
    expect(timeSelect).toBeInTheDocument();
    expect(timeSelect).toHaveTextContent(/From starting II contributions \(2004-03-19\)/);
    expect(timeSelect).toHaveTextContent(/From Tuleva II pillar fund creation \(2017-04-27\)/);
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

  test('renders 3rd pillar time period select', async () => {
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    const timeSelect = await findTimePeriodSelect();
    expect(timeSelect).toBeInTheDocument();
    expect(timeSelect).toHaveTextContent(/From starting III contributions \(2004-03-19\)/);
    expect(timeSelect).toHaveTextContent(/From Tuleva III pillar fund creation \(2019-10-14\)/);
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

  test('renders 2nd pillar compare to select', async () => {
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

  test('renders 3rd pillar compare to select', async () => {
    userBackend(server);
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    const comparisonSelect = comparedToSelect();
    expect(comparisonSelect).toBeInTheDocument();

    expect(comparisonSelect).toHaveTextContent('World market index');
    expect(comparisonSelect).toHaveTextContent('Estonia inflation rate');
    expect(comparisonSelect).toHaveTextContent('Tuleva III Samba Pensionifond');
  });

  test('displays too short time period alert', async () => {
    userBackend(server);
    const comp = component();
    expect(comp).toBeInTheDocument();

    await awaitForInitialData();

    setReturnsData(returnsData2YearsAgo);
    userEvent.selectOptions(timePeriodSelect(), 'Last 2 years');
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

  test('does not display too short time period alert above the threshold', async () => {
    userBackend(server);
    const comp = component();
    expect(comp).toBeInTheDocument();

    await awaitForInitialData();

    setReturnsData(returnsData2YearsAnd1DayAgo);
    userEvent.selectOptions(timePeriodSelect(), 'Last 2 years');
    await awaitForReturnsData();

    await waitFor(() => {
      expect(
        screen.queryByText(
          'The comparison period is short. Avoid the temptation to make sudden moves based on short-term fluctuations.',
        ),
      ).not.toBeInTheDocument();
    });
  });

  test('II pillar content with negative performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexNegative);
    await awaitForInitialData();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-orange.fw-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('7.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with largest absolute negative performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexAbsoluteNegative);
    await awaitForInitialData();

    expect(
      await screen.findByText(/Your II pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−37 000 €/i, {
        selector: '.text-orange.fw-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const bars = within(graphSection()).getAllByRole('figure');
    expect(bars).toHaveLength(2);

    const negativeBarPercentage = within(bars[0]).queryByText('-17.0%');
    expect(negativeBarPercentage).toBeVisible();

    const largeBarPercentage = within(bars[1]).getByText('9.0%');
    expect(largeBarPercentage).toBeVisible();

    expect(within(bars[0]).getByText('−21 000 €')).toBeInTheDocument();
    expect(within(bars[1]).getByText('+16 000 €')).toBeInTheDocument();

    expect(within(bars[0]).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(bars[1]).getByText('World market index')).toBeInTheDocument();

    expect(bars[0]).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(bars[1]).toHaveAttribute('data-testid', 'bar-INDEX');

    const smallBarGraph = within(bars[0]).getByRole('presentation');
    expect(smallBarGraph).toHaveStyle('height: 100px');
    const largeBarGraph = within(bars[1]).getByRole('presentation');
    expect(largeBarGraph).toHaveStyle('height: 76.19047619047619px');
  });

  test('Hide percentage when graph bar is too small', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarSmallPersonalReturn);
    await awaitForInitialData();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const bars = within(graphSection()).getAllByRole('figure');
    expect(bars).toHaveLength(2);

    const largeBarPercentage = within(bars[1]).getByText('9.0%');
    expect(largeBarPercentage).toBeVisible();

    const smallBarPercentage = within(bars[0]).queryByText('1.0%');
    expect(smallBarPercentage).not.toBeInTheDocument();

    expect(within(bars[0]).getByText('+1 000 €')).toBeInTheDocument();
    expect(within(bars[1]).getByText('+16 000 €')).toBeInTheDocument();

    expect(within(bars[0]).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(bars[1]).getByText('World market index')).toBeInTheDocument();

    expect(bars[0]).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(bars[1]).toHaveAttribute('data-testid', 'bar-INDEX');

    const smallBarGraph = within(bars[0]).getByRole('presentation');
    expect(smallBarGraph).toHaveStyle('height: 12.5px');
    const largeBarGraph = within(bars[1]).getByRole('presentation');
    expect(largeBarGraph).toHaveStyle('height: 200px');
  });

  test('II pillar content with positive performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexPositive);
    await awaitForInitialData();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past 4 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/1 000 €/i, { selector: '.result-positive' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has better performance./i)).toBeInTheDocument();

    await checkForExplanationSubtext();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graphSection()).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('10.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexNeutral);
    await awaitForInitialData();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(await screen.findByText(/has similar performance./i)).toBeInTheDocument();

    expect(
      await screen.findByText(
        "Stick with a low-cost index fund and keep investing, no matter the market's highs and lows.",
      ),
    ).toBeInTheDocument();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.5%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to 2nd pillar average with 3 bars', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarAverage);
    await awaitForInitialData();
    userEvent.selectOptions(comparedToSelect(), 'Estonian II pillar funds average performance');
    await awaitForReturnsData();

    // Content text
    expect(
      await screen.findByText(
        /Your II pillar over the past 6 years has achieved a result close to/i,
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Estonian II pillar funds average/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/performance./i)).toBeInTheDocument();

    expect(await screen.findByText(/If you had earned/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/the world market index/i, { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /return, your pension assets would have grown instead of \+11 000 € to \+16 000 €/i,
      ),
    ).toBeInTheDocument();

    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('6.9%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 136.25px');
    expect(within(graphSection()).getByText('+10 900 €')).toBeInTheDocument();
    expect(
      within(graphSection()).getByText('Estonian II pillar funds average performance'),
    ).toBeInTheDocument();
    const secondBar = within(graphSection())
      .getByText('Estonian II pillar funds average performance')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 200px');
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('II pillar content CPI over performing index and bar being red', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarCpi);
    await awaitForInitialData();
    userEvent.selectOptions(comparedToSelect(), 'Estonia inflation rate');
    await awaitForReturnsData();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Estonian inflation/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/performance./i)).toBeInTheDocument();

    expect(await screen.findByText(/If you had earned/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/the world market index/i, { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /return, your pension assets would have grown instead of \+11 000 € to \+16 000 €/i,
      ),
    ).toBeInTheDocument();

    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 115.78947368421053px');
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('10.0%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 200px');
    expect(within(graphSection()).getByText('+19 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('Estonia inflation rate')).toBeInTheDocument();
    const secondBar = within(graphSection())
      .getByText('Estonia inflation rate')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 168.42105263157893px');
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('II pillar content with neutral performance compared to a fund', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarAndFund);
    await awaitForInitialData();
    userEvent.selectOptions(comparedToSelect(), 'Swedbank Pension Fund K60');
    await awaitForReturnsData();

    // Content text
    expect(
      await screen.findByText(
        /Your II pillar over the past 6 years has achieved a result close to/i,
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Swedbank Pension Fund K60/i, { selector: 'strong' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/performance./i)).toBeInTheDocument();

    expect(await screen.findByText(/If you had earned/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/the world market index/i, { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /return, your pension assets would have grown instead of \+11 000 € to \+16 000 €/i,
      ),
    ).toBeInTheDocument();

    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('Your II pillar')).toBeInTheDocument();
    const secondBar = within(graphSection())
      .getByText('Your II pillar')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 200px');
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('no CTA button when user is already fully converted', async () => {
    userBackend(server);
    userConversionBackend(server);
    await awaitForInitialData();

    expect(screen.queryByText('Bring your II pillar to Tuleva')).not.toBeInTheDocument();
  });

  test('CTA button when user is not fully converted', async () => {
    userBackend(server);
    userConversionBackend(
      server,
      { transfersComplete: false, selectionComplete: false },
      { transfersComplete: false, selectionComplete: false, paymentComplete: false },
    );
    await awaitForInitialData();

    expect(await screen.findByText(/Bring your II pillar to Tuleva/i)).toBeInTheDocument();
  });

  test('III pillar explanation text with negative performance compared to the index', async () => {
    setReturnsData(returnsData3rdPillarIndexNegative);
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    expect(
      await screen.findByText(/Your III pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-orange.fw-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection()).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('7.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
  });

  test('III pillar explanation text with positive performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData3rdPillarIndexPositive);
    await awaitForInitialData();

    userEvent.click(pillar3button());
    await awaitForReturnsData();

    expect(
      await screen.findByText(/Your III pillar during the past 4 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/1 000 €/i, { selector: '.result-positive' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has better performance./i)).toBeInTheDocument();

    await checkForExplanationSubtext();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graphSection()).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('10.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
  });

  test('III pillar explanation text with neutral performance compared to index', async () => {
    setReturnsData(returnsData3rdPillarIndexNeutral);
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    expect(
      await screen.findByText(/Your III pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(await screen.findByText(/has similar performance./i)).toBeInTheDocument();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection()).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection()).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection()).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection()).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection()).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection()).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection()).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection()).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graphSection()).getByText('9.0%')).toBeInTheDocument();
    expect(within(graphSection()).getByText('9.5%')).toBeInTheDocument();
  });

  test('II pillar content with incomparable fund', async () => {
    setReturnsData(returnsData2ndPillarAndIncomparableFund);
    await awaitForInitialData();
    userEvent.selectOptions(timePeriodSelect(), 'Last 20 years');
    userEvent.selectOptions(comparedToSelect(), 'Young Fund');
    await awaitForReturnsData();

    expect(await screen.findByText(/Young Fund/i, { selector: 'strong' })).toBeInTheDocument();
    expect(await screen.findByText(/is younger /i)).toBeInTheDocument();
    expect(
      await screen.findByText(/than selected time period, performances are not comparable/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Shorten the time period or select another comparison./i),
    ).toBeInTheDocument();
  });
});

const returnsData2YearsAgo: ReturnsResponse = {
  from: moment().subtract(2, 'years').add(1, 'days').format(),
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

const returnsData2YearsAnd1DayAgo: ReturnsResponse = {
  from: moment().subtract(2, 'years').subtract(1, 'days').format(),
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
const returnsData2ndPillarIndexNegative: ReturnsResponse = {
  from: '2018-06-06',
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

const returnsData2ndPillarIndexAbsoluteNegative: ReturnsResponse = {
  from: '2018-06-06',
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
      rate: -0.17,
      amount: -21000.0,
      paymentsSum: 15000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};

const returnsData2ndPillarIndexPositive: ReturnsResponse = {
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
const returnsData2ndPillarIndexNeutral: ReturnsResponse = {
  from: moment().subtract(6, 'years').format(),
  returns: [
    {
      key: 'UNION_STOCK_INDEX',
      rate: 0.095,
      amount: 16100.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
    {
      key: 'SECOND_PILLAR',
      rate: 0.09,
      amount: 16000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
const returnsData3rdPillarIndexNegative: ReturnsResponse = {
  from: '2018-06-06',
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
      key: 'THIRD_PILLAR',
      rate: 0.07,
      amount: 11000.0,
      paymentsSum: 15000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
const returnsData3rdPillarIndexPositive: ReturnsResponse = {
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
      key: 'THIRD_PILLAR',
      rate: 0.1,
      amount: 17000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
const returnsData3rdPillarIndexNeutral: ReturnsResponse = {
  from: moment().subtract(6, 'years').format(),
  returns: [
    {
      key: 'UNION_STOCK_INDEX',
      rate: 0.095,
      amount: 16100.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
    {
      key: 'THIRD_PILLAR',
      rate: 0.09,
      amount: 16000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};

const returnsData2ndPillarAverage: ReturnsResponse = {
  from: moment().subtract(6, 'years').format(),
  returns: [
    {
      key: 'EPI',
      rate: 0.069,
      amount: 10900.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
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

const returnsData2ndPillarCpi: ReturnsResponse = {
  from: moment().subtract(6, 'years').format(),
  returns: [
    {
      key: 'CPI',
      rate: 0.1,
      amount: 19000.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'INDEX',
    },
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

const returnsData2ndPillarAndFund: ReturnsResponse = {
  from: moment().subtract(6, 'years').format(),
  returns: [
    {
      key: 'EE0123',
      rate: 0.069,
      amount: 10900.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'FUND',
    },
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

const returnsData2ndPillarAndIncomparableFund: ReturnsResponse = {
  from: moment().subtract(1, 'years').format(),
  returns: [
    {
      key: 'EE0123',
      rate: 0.069,
      amount: 10900.0,
      paymentsSum: 14000.0,
      currency: 'EUR',
      type: 'FUND',
    },
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

const returnsData2ndPillarSmallPersonalReturn: ReturnsResponse = {
  from: '2018-06-06',
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
      rate: 0.01,
      amount: 1000.0,
      paymentsSum: 15000.0,
      currency: 'EUR',
      type: 'PERSONAL',
    },
  ],
};
