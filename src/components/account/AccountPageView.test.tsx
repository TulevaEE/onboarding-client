import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import * as testModeUtils from '../common/test-mode';
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

  userConversionBackend(server);
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

test('withdrawals link is not shown by default', async () => {
  expect(screen.queryByText(/Withdrawals/)).not.toBeInTheDocument();
});

test('user data is shown', async () => {
  expect(await screen.findByText('Hi, John Doe!')).toBeInTheDocument();
  expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  expect(screen.getByText('55667788')).toBeInTheDocument();
});

test('pension summary table is shown', async () => {
  // eslint-disable-next-line testing-library/no-node-access,@typescript-eslint/no-non-null-assertion
  const summarySection = screen.getByText('Your pension summary').parentElement!.parentElement!;

  expect(
    await within(summarySection).findByRole('cell', { name: 'Your member capital' }),
  ).toBeInTheDocument();
  const getRow = (name: string) =>
    // eslint-disable-next-line testing-library/no-node-access,@typescript-eslint/no-non-null-assertion
    within(summarySection).getByRole('cell', { name }).parentElement!;

  const secondPillarRow = getRow('II Pillar');
  expect(within(secondPillarRow).getByText('12 345.67 €')).toBeInTheDocument();
  expect(within(secondPillarRow).queryByText('0.00 €')).not.toBeInTheDocument();
  expect(within(secondPillarRow).getByText('102 654.33 €')).toBeInTheDocument();
  expect(within(secondPillarRow).getByText('115 000.00 €')).toBeInTheDocument();

  const thirdPillarRow = getRow('III Pillar');
  expect(within(thirdPillarRow).getByText('9 876.54 €')).toBeInTheDocument();
  expect(within(thirdPillarRow).queryByText('0.00 €')).not.toBeInTheDocument();
  expect(within(thirdPillarRow).getByText('−4 177.18 €')).toBeInTheDocument();
  expect(within(thirdPillarRow).getByText('5 699.36 €')).toBeInTheDocument();

  const memberCapitalRow = getRow('Your member capital');
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
