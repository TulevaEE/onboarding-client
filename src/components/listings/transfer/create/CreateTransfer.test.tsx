import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
  capitalTransferContractBackend,
  memberCapitalListingsBackend,
  useTestBackends,
  useTestBackendsExcept,
} from '../../../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';

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

  useTestBackendsExcept(server, ['capitalTransferContract']);
  initializeComponent();

  history.push('/capital/transfer/create');
});

describe('member capital transfer creation', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server);
  });

  test('allows to create transfer', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(await screen.findByText(/Sellele isikukoodile vastab/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva ühistu liige #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Kinnitan ostja/i));

    const amountInput = await screen.findByLabelText(/Ühikute arv/i);
    const priceInput = await screen.findByLabelText(/Ühiku hind/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '2.5');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(await screen.findByText(/Lepingu eelvaade/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/30303039914/i)).toBeInTheDocument();

    expect(await screen.findByText(/2.50 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/100 ühikut/i)).toBeInTheDocument();
    // TODO unitsOfMemberCapital assert
    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    userEvent.click(
      await screen.findByLabelText(
        /Kinnitan, et täidan võlaõigusseaduse kohaselt oma lepingulisi kohustusi täies ulatuses ja vastavalt kokkulepitud tingimustele./i,
      ),
    );

    userEvent.click(await screen.findByText(/Allkirjastan lepingu/i));

    expect(
      await screen.findByText(/Leping on sinu poolt allkirjastatud/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Vaatan staatust/i));

    expect(await screen.findByText(/Allkirjastatud/i)).toBeInTheDocument();
  });

  // TODO iban, validation tests
});
