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
  return screen.getByTestId('pillar3Button');
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

  test('renders 2nd pillar time period select', async () => {
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

  test('renders 3rd pillar time period select', async () => {
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    const timeSelect = timePeriodSelect();
    expect(timeSelect).toBeInTheDocument();
    expect(timeSelect).toHaveTextContent('From starting III contributions (March 19, 2004)');
    expect(timeSelect).toHaveTextContent('From Tuleva III pillar fund creation (October 14, 2019)');
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

  test('II pillar content with negative performance compared to the index', async () => {
    setReturnsData(returnsData2ndPillarIndexNegative);
    await awaitForInitialData();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-orange.text-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(255, 72, 0)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('7.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with positive performance compared to the index', async () => {
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

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graphSection).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(81, 194, 108)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('10.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to the index', async () => {
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

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(81, 194, 108)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.5%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to 2nd pillar average with 3 bars', async () => {
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
        /return, your pension assets would have grown instead of 11 000 € to 16 000 €/i,
      ),
    ).toBeInTheDocument();

    const graphSection = screen.getByTestId('graph-section');

    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graphSection).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(255, 72, 0)');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('6.9%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 136.25px');
    expect(within(graphSection).getByText('+10 900 €')).toBeInTheDocument();
    expect(
      within(graphSection).getByText('Estonian II pillar funds average performance'),
    ).toBeInTheDocument();
    const secondBar = within(graphSection)
      .getByText('Estonian II pillar funds average performance')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveStyle('background-color: rgb(255, 72, 0)');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 200px');
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveStyle('background-color: rgb(0, 129, 238)');
  });

  test('II pillar content CPI over performing index and bar being red', async () => {
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
        /return, your pension assets would have grown instead of 11 000 € to 16 000 €/i,
      ),
    ).toBeInTheDocument();

    const graphSection = screen.getByTestId('graph-section');

    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 115.78947368421053px');
    expect(within(graphSection).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(255, 72, 0)');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('10.0%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 200px');
    expect(within(graphSection).getByText('+19 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('Estonia inflation rate')).toBeInTheDocument();
    const secondBar = within(graphSection)
      .getByText('Estonia inflation rate')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveStyle('background-color: rgb(255, 72, 0)');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 168.42105263157893px');
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveStyle('background-color: rgb(0, 129, 238)');
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

  test('III pillar explanation text with negative performance compared to the index', async () => {
    setReturnsData(returnsData3rdPillarIndexNegative);
    await awaitForInitialData();
    userEvent.click(pillar3button());
    await awaitForReturnsData();

    expect(
      await screen.findByText(/Your III pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-orange.text-bold',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(255, 72, 0)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('7.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
  });

  test('III pillar explanation text with positive performance compared to the index', async () => {
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

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graphSection).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(81, 194, 108)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('10.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
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

    const graphSection = screen.getByTestId('graph-section');

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graphSection).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graphSection).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graphSection).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graphSection).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graphSection).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graphSection).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graphSection).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graphSection).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveStyle('background-color: rgb(81, 194, 108)');
    expect(secondBar).toHaveStyle('background-color: rgb(0, 129, 238)');

    // Bar percentages
    expect(within(graphSection).getByText('9.0%')).toBeInTheDocument();
    expect(within(graphSection).getByText('9.5%')).toBeInTheDocument();
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
