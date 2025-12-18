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

async function component() {
  return screen.findByRole('region', { name: 'Comparison Calculator' });
}

function queryComponent() {
  return screen.queryByRole('region', { name: 'Comparison Calculator' });
}

function queryComponentLoading() {
  return screen.queryByRole('region', { name: 'Comparison Calculator loading' });
}

async function timePeriodSelect() {
  return screen.findByRole('combobox', { name: /time period/i });
}

async function comparedToSelect() {
  return screen.findByRole('combobox', { name: /compared to/i });
}

async function graphSection() {
  return screen.findByRole('figure', { name: 'Comparison Calculator Figure' });
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

async function pillar3button() {
  return screen.findByRole('button', { name: /Your III pillar/i });
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
    const comp = await component();

    expect(comp).toBeInTheDocument();
  });

  test('renders pillar selection', async () => {
    userBackend(server);
    const calculator = await component();

    const secondPillarButton = within(calculator).getByRole('button', { name: 'Your II pillar' });
    const thirdPillarButton = within(calculator).getByRole('button', { name: 'Your III pillar' });

    expect(secondPillarButton).toBeInTheDocument();
    expect(thirdPillarButton).toBeInTheDocument();

    expect(secondPillarButton).toHaveClass('btn-primary');
    expect(thirdPillarButton).toHaveClass('btn-light');
  });

  test('does not render pillar selection when user has only second pillar', async () => {
    userBackend(server, { thirdPillarActive: true, secondPillarActive: false });
    const calculator = await component();

    const secondPillarButton = within(calculator).queryByRole('button', {
      name: 'Your II pillar',
    });
    const thirdPillarButton = within(calculator).queryByRole('button', {
      name: 'Your III pillar',
    });

    expect(secondPillarButton).not.toBeInTheDocument();
    expect(thirdPillarButton).not.toBeInTheDocument();
  });

  test('does not render pillar selection when user has only second pillar', async () => {
    userBackend(server, { thirdPillarActive: false, secondPillarActive: true });
    const calculator = await component();

    const secondPillarButton = within(calculator).queryByRole('button', {
      name: 'Your II pillar',
    });
    const thirdPillarButton = within(calculator).queryByRole('button', {
      name: 'Your III pillar',
    });

    expect(secondPillarButton).not.toBeInTheDocument();
    expect(thirdPillarButton).not.toBeInTheDocument();
  });

  test('does not render component when user does not have active II or III pillar', async () => {
    userBackend(server, { thirdPillarActive: false, secondPillarActive: false });
    await waitForElementToBeRemoved(queryComponentLoading());
    expect(queryComponent()).not.toBeInTheDocument();
  });

  test('renders 2nd pillar time period select', async () => {
    await component();

    const timeSelect = await timePeriodSelect();
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

  test('defaults to Tuleva inception date when user started II pillar before Tuleva', async () => {
    userBackend(server, { secondPillarOpenDate: '2004-03-19' });
    await component();

    const timeSelect = await timePeriodSelect();
    expect(timeSelect).toHaveValue('2017-04-27');
  });

  test('defaults to user start date when user started II pillar after Tuleva inception', async () => {
    userBackend(server, { secondPillarOpenDate: '2020-01-01' });
    await component();

    const timeSelect = await timePeriodSelect();
    expect(timeSelect).toHaveValue('2020-01-01');
  });

  test('defaults to Tuleva inception date when user started III pillar before Tuleva', async () => {
    userBackend(server, { thirdPillarInitDate: '2004-03-19' });
    await component();
    userEvent.click(await pillar3button());

    const timeSelect = await timePeriodSelect();
    expect(timeSelect).toHaveValue('2019-10-14');
  });

  test('defaults to user start date when user started III pillar after Tuleva inception', async () => {
    userBackend(server, { thirdPillarInitDate: '2022-01-01' });
    await component();
    userEvent.click(await pillar3button());

    const timeSelect = await timePeriodSelect();
    expect(timeSelect).toHaveValue('2022-01-01');
  });

  test('renders 3rd pillar time period select', async () => {
    await component();
    userEvent.click(await pillar3button());

    const timeSelect = await timePeriodSelect();
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
    await component();

    const comparisonSelect = await comparedToSelect();
    expect(comparisonSelect).toBeInTheDocument();

    expect(comparisonSelect).toHaveTextContent('World market index');
    expect(comparisonSelect).toHaveTextContent('Average Estonian II pillar fund');
    expect(comparisonSelect).toHaveTextContent('Estonia inflation rate');
    expect(comparisonSelect).toHaveTextContent('Tuleva World Stocks Pension Fund');
    expect(comparisonSelect).toHaveTextContent('Tuleva World Bonds Pension Fund');
    expect(comparisonSelect).toHaveTextContent('Swedbank Pension Fund K60');
  });

  test('renders dynamic fee range in comparison dropdown group labels', async () => {
    await component();

    const comparisonSelect = await comparedToSelect();
    expect(
      within(comparisonSelect).getByRole('group', { name: 'Low fee funds (below 0.5%)' }),
    ).toBeInTheDocument();
    expect(
      within(comparisonSelect).getByRole('group', {
        name: /High fee funds \(\d+\.\d+%–\d+\.\d+%\)/,
      }),
    ).toBeInTheDocument();
  });

  test('renders 3rd pillar compare to select', async () => {
    userBackend(server);
    await component();
    userEvent.click(await pillar3button());

    const comparisonSelect = await comparedToSelect();
    expect(comparisonSelect).toBeInTheDocument();

    expect(comparisonSelect).toHaveTextContent('World market index');
    expect(comparisonSelect).toHaveTextContent('Average Estonian III pillar fund');
    expect(comparisonSelect).toHaveTextContent('Estonia inflation rate');
    expect(comparisonSelect).toHaveTextContent('Tuleva III Samba Pensionifond');
  });

  test('displays too short time period alert', async () => {
    userBackend(server);
    const calculator = await component();
    expect(calculator).toBeInTheDocument();

    setReturnsData(returnsData2YearsAgo);
    userEvent.selectOptions(await timePeriodSelect(), 'Last 2 years');

    expect(
      await screen.findByText(
        'The comparison period is short. Avoid the temptation to make sudden moves based on short-term fluctuations.',
      ),
    ).toBeInTheDocument();

    setReturnsData(returnsData4YearsAgo);
    userEvent.selectOptions(await timePeriodSelect(), 'Last 4 years');
    await component();

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
    const calculator = await component();
    expect(calculator).toBeInTheDocument();

    setReturnsData(returnsData2YearsAnd1DayAgo);
    userEvent.selectOptions(await timePeriodSelect(), 'Last 2 years');
    await component();

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
    await component();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-danger',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const graph = await graphSection();
    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('7.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with largest absolute negative performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexAbsoluteNegative);
    await component();

    expect(
      await screen.findByText(/Your II pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−37 000 €/i, {
        selector: '.text-danger',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const graph = await graphSection();
    const bars = within(graph).getAllByRole('figure');
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
    await component();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();

    const graph = await graphSection();
    const bars = within(graph).getAllByRole('figure');
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
    await component();

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

    const graph = await graphSection();
    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graph).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('10.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarIndexNeutral);
    await component();

    // Content text
    expect(
      await screen.findByText(/Your II pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(await screen.findByText(/has similar performance./i)).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Stick with a low-cost index fund and keep investing, no matter the market’s highs and lows.',
      ),
    ).toBeInTheDocument();

    const graph = await graphSection();
    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.5%')).toBeInTheDocument();
  });

  test('II pillar content with neutral performance compared to 2nd pillar average with 3 bars', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarAverage);
    await component();
    userEvent.selectOptions(await comparedToSelect(), 'Average Estonian II pillar fund');
    await component();

    // Content text
    expect(
      await screen.findByText(
        /Your II pillar over the past 6 years has achieved a result close to/i,
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/average Estonian II pillar fund/i, { selector: 'strong' }),
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

    const graph = await graphSection();
    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('6.9%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 136.25px');
    expect(within(graph).getByText('+10 900 €')).toBeInTheDocument();
    expect(within(graph).getByText('Average Estonian II pillar fund')).toBeInTheDocument();
    const secondBar = within(graph)
      .getByText('Average Estonian II pillar fund')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 200px');
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graph).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('II pillar content CPI over performing index and bar being red', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarCpi);
    await component();
    userEvent.selectOptions(await comparedToSelect(), 'Estonia inflation rate');
    await component();

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

    const graph = await graphSection();
    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 115.78947368421053px');
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('10.0%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 200px');
    expect(within(graph).getByText('+19 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('Estonia inflation rate')).toBeInTheDocument();
    const secondBar = within(graph)
      .getByText('Estonia inflation rate')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 168.42105263157893px');
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graph).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('II pillar content with neutral performance compared to a fund', async () => {
    userBackend(server);
    setReturnsData(returnsData2ndPillarAndFund);
    await component();
    userEvent.selectOptions(await comparedToSelect(), 'Swedbank Pension Fund K60');
    await component();

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

    const graph = await graphSection();
    // First Bar
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your II pillar').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Second Bar
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    expect(secondBarGraph).toHaveStyle('height: 137.5px');
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('Your II pillar')).toBeInTheDocument();
    const secondBar = within(graph)
      .getByText('Your II pillar')
      // eslint-disable-next-line testing-library/no-node-access
      .closest('.bar');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');

    // Third Bar
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(thirdBarGraph).toHaveStyle('height: 200px');
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const thirdBar = within(graph).getByText('World market index').closest('.bar');
    expect(thirdBar).toHaveAttribute('data-testid', 'bar-INDEX');
  });

  test('no CTA button when user is already fully converted', async () => {
    userBackend(server);
    userConversionBackend(server);
    await component();

    expect(screen.queryByText('Bring your II pillar to Tuleva')).not.toBeInTheDocument();
  });

  test('CTA button when user is not fully converted', async () => {
    userBackend(server);
    userConversionBackend(
      server,
      { transfersComplete: false, selectionComplete: false },
      { transfersComplete: false, selectionComplete: false, paymentComplete: false },
    );
    await component();

    expect(await screen.findByText(/Bring your II pillar to Tuleva/i)).toBeInTheDocument();
  });

  test('III pillar explanation text with negative performance compared to the index', async () => {
    setReturnsData(returnsData3rdPillarIndexNegative);
    await component();
    userEvent.click(await pillar3button());
    await component();

    expect(
      await screen.findByText(/Your III pillar during the past \d years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/−5 000 €/i, {
        selector: '.text-danger',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has underperformance./i)).toBeInTheDocument();
    await checkForExplanationSubtext();
    const graph = await graphSection();

    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('7.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 137.5px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graph).getByText('+11 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-NEGATIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('7.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
  });

  test('III pillar explanation text with positive performance compared to the index', async () => {
    userBackend(server);
    setReturnsData(returnsData3rdPillarIndexPositive);
    await component();

    userEvent.click(await pillar3button());
    await component();

    expect(
      await screen.findByText(/Your III pillar during the past 4 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(
      await screen.findByText(/1 000 €/i, { selector: '.result-positive' }),
    ).toBeInTheDocument();

    expect(await screen.findByText(/has better performance./i)).toBeInTheDocument();

    await checkForExplanationSubtext();

    const graph = await graphSection();
    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('10.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 200px');
    expect(secondBarGraph).toHaveStyle('height: 188.23529411764704px');

    // Bar amounts
    expect(within(graph).getByText('+17 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('10.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
  });

  test('III pillar explanation text with neutral performance compared to index', async () => {
    setReturnsData(returnsData3rdPillarIndexNeutral);
    await component();
    userEvent.click(await pillar3button());
    await component();

    expect(
      await screen.findByText(/Your III pillar during the past 6 years, when compared to/i),
    ).toBeInTheDocument();

    await expectAllWorldMarketInBold();

    expect(await screen.findByText(/has similar performance./i)).toBeInTheDocument();

    const graph = await graphSection();
    // Bar heights
    // eslint-disable-next-line testing-library/no-node-access
    const firstBarGraph = within(graph).getByText('9.0%').closest('.bar-graph');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBarGraph = within(graph).getByText('9.5%').closest('.bar-graph');
    expect(firstBarGraph).toHaveStyle('height: 198.75776397515529px');
    expect(secondBarGraph).toHaveStyle('height: 200px');

    // Bar amounts
    expect(within(graph).getByText('+16 000 €')).toBeInTheDocument();
    expect(within(graph).getByText('+16 100 €')).toBeInTheDocument();

    // Bar labels
    expect(within(graph).getByText('Your III pillar')).toBeInTheDocument();
    expect(within(graph).getByText('World market index')).toBeInTheDocument();

    // Bar colors
    // eslint-disable-next-line testing-library/no-node-access
    const firstBar = within(graph).getByText('Your III pillar').closest('.bar');
    // eslint-disable-next-line testing-library/no-node-access
    const secondBar = within(graph).getByText('World market index').closest('.bar');
    expect(firstBar).toHaveAttribute('data-testid', 'bar-POSITIVE');
    expect(secondBar).toHaveAttribute('data-testid', 'bar-INDEX');

    // Bar percentages
    expect(within(graph).getByText('9.0%')).toBeInTheDocument();
    expect(within(graph).getByText('9.5%')).toBeInTheDocument();
  });

  test('II pillar content with incomparable fund', async () => {
    setReturnsData(returnsData2ndPillarAndIncomparableFund);
    await component();
    userEvent.selectOptions(await timePeriodSelect(), 'Last 20 years');
    userEvent.selectOptions(await comparedToSelect(), 'Young Fund');
    await component();

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
  from: moment().subtract(2, 'years').add(1, 'days').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(2, 'years').subtract(1, 'days').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(4, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  to: moment().format('YYYY-MM-DD'),
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
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(4, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(6, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(4, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(6, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(6, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(6, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(6, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  from: moment().subtract(1, 'years').format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
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
  to: moment().format('YYYY-MM-DD'),
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
