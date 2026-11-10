import React from 'react';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import {
  pensionAccountStatementBackend,
  useTestBackends,
  userConversionBackend,
} from '../../test/backend';
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
  unavailableValue: 0,
  currency: 'EUR',
  activeContributions: true,
  contributions: value,
  subtractions: 0,
  profit: 0,
  units: value,
});

const renderPage = () => {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(<SecondPillarFees />, history as any, store);
};

beforeEach(() => {
  initializeConfiguration();
  useTestBackends(server);
});

test('shows a saver in high-fee funds what they pay in fees this year compared with the Tuleva fund', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0065 });
  pensionAccountStatementBackend(server, [fundBalance('EE3600019758', 2, 0.0065, 20000)]);

  renderPage();

  expect(
    await screen.findByRole('heading', { name: 'Euros paid in fees earn no returns' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /\(0\.65% per year\)\. This year, you will pay 130\s€ for fees\. With Tuleva fund you would pay 56\s€\. Saving 74\s€ per year/,
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
    'href',
    '/2nd-pillar-flow',
  );
});

test('tells a saver whose II pillar is already in low-fee funds that their fees are low', async () => {
  userConversionBackend(server, { weightedAverageFee: 0.0028 });
  pensionAccountStatementBackend(server, [fundBalance('EE3600109435', 2, 0.0028, 15000)]);

  renderPage();

  expect(
    await screen.findByRole('heading', { name: /^Your II\spillar fees are already low$/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  expect(
    screen.queryByRole('heading', { name: 'Euros paid in fees earn no returns' }),
  ).not.toBeInTheDocument();
});

test('offers a person without a II pillar to open one', async () => {
  userConversionBackend(server, { weightedAverageFee: 0 });
  pensionAccountStatementBackend(server, [fundBalance('EE3600001707', 3, 0.0029, 5000)]);

  renderPage();

  expect(
    await screen.findByRole('heading', { name: 'Next, it is smart to open a second pillar' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open my second pillar' })).toHaveAttribute(
    'href',
    '/2nd-pillar-flow',
  );
});
