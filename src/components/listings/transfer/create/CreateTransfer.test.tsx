import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { capitalTransferContractBackend, useTestBackendsExcept } from '../../../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { getBuyerDetailsSection, getSellerDetailsSection } from '../testUtils';
import { getFullName } from '../../../common/utils';
import { mockUser } from '../../../../test/backend-responses';

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

    const amountInput = await screen.findByLabelText(/Müüdav liikmekapitali maht/i);
    const priceInput = await screen.findByLabelText(/Hinnaga/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(await screen.findByText(/Lepingu eelvaade/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/100.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();
    // TODO unitsOfMemberCapital assert

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
    expect(await screen.findByText(/Ostja allkirja ootel/i)).toBeInTheDocument();
  });

  test('does not allow to create without selected member', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039913');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(
      await screen.findByText(/Sellele isikukoodile ei vasta ühtegi Tuleva ühistu liiget./i),
    ).toBeInTheDocument();
  });

  test('does not allow to create with invalid amount', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(await screen.findByText(/Sellele isikukoodile vastab/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva ühistu liige #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Kinnitan ostja/i));

    const amountInput = await screen.findByLabelText(/Müüdav liikmekapitali maht/i);
    const priceInput = await screen.findByLabelText(/Hinnaga/i);

    userEvent.type(amountInput, '10000000');
    userEvent.type(priceInput, '2.5');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(
      await screen.findByText(/TODO Sul ei ole piisavalt liikmekapitali mahtu/i),
    ).toBeInTheDocument();

    expect(amountInput).toBeInTheDocument();
  });

  test('does not allow to create with invalid price', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(await screen.findByText(/Sellele isikukoodile vastab/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva ühistu liige #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Kinnitan ostja/i));

    const amountInput = await screen.findByLabelText(/Müüdav liikmekapitali maht/i);
    const priceInput = await screen.findByLabelText(/Hinnaga/i);

    userEvent.type(amountInput, '10');
    userEvent.type(priceInput, '0.1');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(
      await screen.findByText(
        /TODO Sa ei saa müüa liikmekapitali hinnaga alla raamatupidamisliku väärtuse /i,
      ),
    ).toBeInTheDocument();

    expect(amountInput).toBeInTheDocument();
  });

  test('does not allow to create with invalid iban', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(await screen.findByText(/Sellele isikukoodile vastab/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva ühistu liige #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Kinnitan ostja/i));

    const amountInput = await screen.findByLabelText(/Müüdav liikmekapitali maht/i);
    const priceInput = await screen.findByLabelText(/Hinnaga/i);

    userEvent.type(amountInput, '10');
    userEvent.type(priceInput, '2');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'INVALID_IBAN');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(amountInput).toBeInTheDocument();
  });
});
