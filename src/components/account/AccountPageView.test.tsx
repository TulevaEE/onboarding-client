import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
// eslint-disable-next-line import/no-named-as-default
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  userBackend,
  userConversionBackend,
  amlChecksBackend,
  pensionAccountStatementBackend,
  fundsBackend,
  returnsBackend,
  userCapitalBackend,
  applicationsBackend,
} from '../../test/backend';

jest.unmock('retranslate');

const server = setupServer();
let history: History;

function render() {
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

  userConversionBackend(server);
  userBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  returnsBackend(server);
  userCapitalBackend(server);
  applicationsBackend(server);

  render();

  history.push('/account');
});

test('user data is shown', async () => {
  await screen.findByText('Hi, John Doe!');
  expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  expect(screen.getByText('55667788')).toBeInTheDocument();
});

test('pension summary table is shown', async () => {
  // eslint-disable-next-line testing-library/no-node-access
  const summarySection = screen.getByText('Your pension summary').parentElement;

  await within(summarySection).findByRole('cell', { name: 'Member capital' });
  // eslint-disable-next-line testing-library/no-node-access
  const getRow = (name: string) => within(summarySection).getByRole('cell', { name }).parentElement;

  const secondPillarRow = getRow('II Pillar');
  expect(within(secondPillarRow).getByText('12 345.67 €')).toBeInTheDocument();
  expect(within(secondPillarRow).getByText('0.00 €')).toBeInTheDocument();
  expect(within(secondPillarRow).getByText('102 654.33 €')).toBeInTheDocument();
  expect(within(secondPillarRow).getByText('115 000.00 €')).toBeInTheDocument();

  const thirdPillarRow = getRow('III Pillar');
  expect(within(thirdPillarRow).getByText('9 876.54 €')).toBeInTheDocument();
  expect(within(thirdPillarRow).getByText('0.00 €')).toBeInTheDocument();
  expect(within(thirdPillarRow).getByText('-4 177.18 €')).toBeInTheDocument();
  expect(within(thirdPillarRow).getByText('5 699.36 €')).toBeInTheDocument();

  const memberCapitalRow = getRow('Member capital');
  expect(within(memberCapitalRow).getByText('1 000.00 €')).toBeInTheDocument();
  expect(within(memberCapitalRow).getByText('0.00 €')).toBeInTheDocument();
  expect(within(memberCapitalRow).getByText('-122.22 €')).toBeInTheDocument();
  expect(within(memberCapitalRow).getByText('877.78 €')).toBeInTheDocument();

  const totalRow = getRow('Total');
  expect(within(totalRow).getByText('23 222.21 €')).toBeInTheDocument();
  expect(within(totalRow).getByText('0.00 €')).toBeInTheDocument();
  expect(within(totalRow).getByText('98 354.93 €')).toBeInTheDocument();
  expect(within(totalRow).getByText('121 577.14 €')).toBeInTheDocument();
});
