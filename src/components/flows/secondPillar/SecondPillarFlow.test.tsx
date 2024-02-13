import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { rest } from 'msw';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  smartIdSigningBackend,
  userBackend,
  userCapitalBackend,
  userConversionBackend,
} from '../../../test/backend';

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

beforeEach(async () => {
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

  history.push('/2nd-pillar-flow');
});

test('2nd pillar flow allows moving all external pension to main Tuleva pension fund', async () => {
  expect(await screen.findByText('Transfer my pension to Tuleva')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Next step' }));

  const selectionSentence = await screen.findByText(/I wish to transfer future fund payments to:/i);
  expect(
    within(selectionSentence).getByText('Tuleva World Stocks Pension Fund'),
  ).toBeInTheDocument();

  const signButton = screen.getByRole('button', { name: 'Sign and send mandate' });
  expect(signButton).toBeDisabled();

  const confirmationCheckbox = screen.getByRole('checkbox', { name: /I confirm/i });
  userEvent.click(confirmationCheckbox);
  expect(signButton).toBeEnabled();

  server.use(
    rest.post('http://localhost/v1/mandates', (req, res, ctx) => {
      return res(ctx.json({ id: 1, pillar: 2 }));
    }),
  );
  smartIdSigningBackend(server);

  userEvent.click(signButton);

  expect(
    await screen.findByRole('heading', { name: 'Application finished' }, { timeout: 10_000 }),
  ).toBeInTheDocument();

  expect(
    await screen.findByText('Your current fund units will be transferred on', { exact: false }),
  ).toBeInTheDocument();

  expect(
    await screen.findByText('the first working day following', { exact: false }),
  ).toBeInTheDocument();

  expect(
    await screen.findByText(
      'Your future contributions will be directed to your selected pension fund',
      { exact: false },
    ),
  ).toBeInTheDocument();

  expect(
    await screen.findByText('starting from the next payment', { exact: false }),
  ).toBeInTheDocument();

  // TODO: Consider testing mandate download
}, 20_000);
