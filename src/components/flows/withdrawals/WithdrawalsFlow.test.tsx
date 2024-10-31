import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  mandateBatchBackend,
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  smartIdMandateBatchSigningBackend,
  transactionsBackend,
  userBackend,
  userConversionBackend,
  withdrawalsEligibilityBackend,
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

  transactionsBackend(server);
  userConversionBackend(server);
  userBackend(server);
  amlChecksBackend(server);
  pensionAccountStatementBackend(server);
  fundsBackend(server);
  applicationsBackend(server);
  returnsBackend(server);
  withdrawalsEligibilityBackend(server);
  smartIdMandateBatchSigningBackend(server);
  mandateBatchBackend(server);
  mandateDeadlinesBackend(server);

  initializeComponent();

  history.push('/withdrawals');
});
describe('withdrawals flow', () => {
  test('reaches final confirmation step to make partial withdrawal with fund pension', async () => {
    expect(
      await screen.findByText(/II ja III samba väljamaksed/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Soovid osa raha kohe välja võtta',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Pangakonto number (IBAN)');

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/Esitan järgmised avaldused ja olen teadlik nende tingimustest/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();

    const applicationTitles = [
      /Igakuised fondipensioni väljamaksed II sambast/,
      /Igakuised fondipensioni väljamaksed III sambast/,
      /Osaline väljamakse II sambast/,
      /Osaline väljamakse III sambast/,
    ];

    await Promise.all(
      applicationTitles.map(async (title, i) =>
        Promise.all([
          expect(await screen.findByText(`Avaldus #${i + 1}`)).toBeInTheDocument(),
          expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument(),
        ]),
      ),
    );

    expect(signButton()).toBeDisabled();

    userEvent.click(confirmationCheckbox());
    expect(signButton()).toBeEnabled();

    userEvent.click(signButton());

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Väljamaksete avaldused esitatud' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  }, 20_000);

  test('reaches final confirmation step to make partial withdrawal with fund pension', async () => {
    expect(
      await screen.findByText(/II ja III samba väljamaksed/i, undefined, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Soovid osa raha kohe välja võtta',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Pangakonto number (IBAN)');

    userEvent.type(ibanInput, 'EE123_INVALID_IBAN');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/Sisestatud IBAN ei ole korrektne. Eesti IBAN on 20-kohaline./i),
    ).toBeInTheDocument();

    userEvent.clear(ibanInput);

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/Esitan järgmised avaldused ja olen teadlik nende tingimustest/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
  }, 20_000);
});

const nextButton = () => screen.getByRole('button', { name: 'Jätkan' });
const confirmationCheckbox = () => screen.getByRole('checkbox');
const signButton = () => screen.getByRole('button', { name: /Allkirjastan/ });
