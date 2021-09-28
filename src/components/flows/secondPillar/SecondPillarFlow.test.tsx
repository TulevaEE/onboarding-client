import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
// eslint-disable-next-line import/no-named-as-default
import { rest } from 'msw';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  userBackend,
  userConversionBackend,
  amlChecksBackend,
  pensionAccountStatementBackend,
  fundsBackend,
  returnsBackend,
  userCapitalBackend,
  applicationsBackend,
  smartIdSigningBackend,
  mandateCreateConfirmPageEventBackend,
} from '../../../test/backend';

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
  mandateCreateConfirmPageEventBackend(server);

  render();

  history.push('/2nd-pillar-flow');
});

test('2nd pillar flow allows moving all external pension to main Tuleva pension fund', async () => {
  await screen.findByText('Transfer my pension to Tuleva');

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
      return res(ctx.json({ id: 1 }));
    }),
  );
  smartIdSigningBackend(server);

  userEvent.click(signButton);

  await screen.findByRole('heading', { name: 'Application finished' }, { timeout: 10_000 });

  // TODO: Consider testing mandate download
}, 20_000);
