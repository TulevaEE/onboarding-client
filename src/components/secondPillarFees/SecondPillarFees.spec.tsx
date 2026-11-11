import React from 'react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  pensionAccountStatementBackend,
  useTestBackends,
  userConversionBackend,
} from '../../test/backend';
import { mockFunds } from '../../test/backend-responses';
import { FundBalance } from '../common/apiModels';
import { SecondPillarFees } from './SecondPillarFees';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const fundBalance = (
  isin: string,
  pillar: 2 | 3,
  ongoingChargesFigure: number,
  value: number,
  unavailableValue = 0,
): FundBalance => ({
  fund: {
    fundManager: { name: isin },
    isin,
    name: isin,
    managementFeeRate: ongoingChargesFigure,
    pillar,
    ongoingChargesFigure,
    status: 'ACTIVE',
    inceptionDate: '2017-01-01',
    nav: 1,
  },
  value,
  unavailableValue,
  currency: 'EUR',
  activeContributions: true,
  contributions: value,
  subtractions: 0,
  profit: 0,
  units: value,
});

const highFeeFund = (value: number, unavailableValue = 0) =>
  fundBalance('EE3600019758', 2, 0.0065, value, unavailableValue);

const renderPage = () => {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <SecondPillarFees />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
};

const expectFeeComparison = async (currentFee: number, tulevaFee: number, savings: number) => {
  expect(
    await screen.findByText(new RegExp(`you would save ${savings}\\s€ a year in fees\\.$`)),
  ).toBeInTheDocument();
  expect(screen.getByText(`−${currentFee} €`)).toBeInTheDocument();
  expect(screen.getByText(`−${tulevaFee} €`)).toBeInTheDocument();
};

const feeComparisonHeading = () =>
  screen.queryByRole('heading', { name: 'Euros paid in fees earn no returns' });

const lowFeesHeading = () =>
  screen.findByRole('heading', { name: /^Your II\spillar fees are already low$/ });

const errorHeading = () =>
  screen.findByRole('heading', {
    name: 'An error occurred. Please try again or reach out to us.',
  });

beforeEach(() => {
  initializeConfiguration();
  useTestBackends(server);
});

test('shows a saver in high-fee funds what they pay in fees this year compared with the Tuleva fund', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  pensionAccountStatementBackend(server, [highFeeFund(20000)]);

  renderPage();

  expect(
    await screen.findByRole('heading', { name: 'Euros paid in fees earn no returns' }),
  ).toBeInTheDocument();
  await expectFeeComparison(130, 56, 74);
  expect(
    screen.getByText(/^Your II\spillar is in a high-fee fund\. In the Tuleva fund, you would save/),
  ).toBeInTheDocument();
  expect(screen.getByText(/^Yearly fees on your current II\spillar savings$/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
    'href',
    '/2nd-pillar-funds',
  );
});

test('speaks of high-fee funds in the plural when the saver holds several', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  pensionAccountStatementBackend(server, [
    highFeeFund(10000),
    fundBalance('EE3600019766', 2, 0.0065, 10000),
  ]);

  renderPage();

  expect(
    await screen.findByText(/^Your II\spillar is in high-fee funds\. In the Tuleva fund/),
  ).toBeInTheDocument();
});

test('counts units that cannot be sold yet into the II pillar fees', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  pensionAccountStatementBackend(server, [highFeeFund(10000, 10000)]);

  renderPage();

  await expectFeeComparison(130, 56, 74);
});

test('compares the fees from a weighted fee of exactly 0.3%', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.003 });
  pensionAccountStatementBackend(server, [highFeeFund(20000)]);

  renderPage();

  await expectFeeComparison(60, 56, 4);
});

test('rounds half a euro up, as the fee comparison in the nudges does', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0045 });
  pensionAccountStatementBackend(server, [highFeeFund(3000)]);

  renderPage();

  await expectFeeComparison(14, 8, 6);
});

test('tells a saver whose II pillar is already in low-fee funds that their fees are low', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0028 });
  pensionAccountStatementBackend(server, [fundBalance('EE3600109435', 2, 0.0028, 15000)]);

  renderPage();

  expect(await lowFeesHeading()).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  expect(feeComparisonHeading()).not.toBeInTheDocument();
});

test('tells a saver their fees are low when the Tuleva fund would not save them a whole euro', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.003 });
  pensionAccountStatementBackend(server, [highFeeFund(1000)]);

  renderPage();

  expect(await lowFeesHeading()).toBeInTheDocument();
  expect(feeComparisonHeading()).not.toBeInTheDocument();
});

test('tells a person without II pillar savings that there are no fees to compare', async () => {
  userConversionBackend(server, { weightedAverageFee: 0 });
  pensionAccountStatementBackend(server, [
    highFeeFund(0),
    fundBalance('EE3600001707', 3, 0.0029, 5000),
  ]);

  renderPage();

  expect(
    await screen.findByRole('heading', {
      name: /^There is no money in your II\spillar to compare fees on$/,
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  expect(screen.queryByRole('link', { name: 'Open my second pillar' })).not.toBeInTheDocument();
});

test('says an error occurred when the account statement cannot be loaded', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  server.use(
    rest.get('http://localhost/v1/pension-account-statement', (req, res, ctx) =>
      res(ctx.status(500)),
    ),
  );

  renderPage();

  expect(await errorHeading()).toBeInTheDocument();
});

test('says an error occurred when the Tuleva fund is missing from the fund list', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  pensionAccountStatementBackend(server, [highFeeFund(20000)]);
  server.use(
    rest.get('http://localhost/v1/funds', (req, res, ctx) =>
      res(ctx.json(mockFunds.filter((fund) => fund.isin !== 'EE3600109435'))),
    ),
  );

  renderPage();

  expect(await errorHeading()).toBeInTheDocument();
  expect(feeComparisonHeading()).not.toBeInTheDocument();
});
