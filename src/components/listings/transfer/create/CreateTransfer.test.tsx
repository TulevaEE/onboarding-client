import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
  capitalTransferContractBackend,
  userCapitalBackend,
  useTestBackendsExcept,
} from '../../../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { getBuyerDetailsSection, getSellerDetailsSection } from '../testUtils';
import { getFullName } from '../../../common/utils';
import { mockUser } from '../../../../test/backend-responses';
import { CapitalType } from '../../../common/apiModels';

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

  useTestBackendsExcept(server, ['capitalTransferContract', 'userCapital']);
  initializeComponent();

  history.push('/capital/transfer/create');
});

describe('member capital transfer creation', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server);
    userCapitalBackend(server, [
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 1000.0,
        profit: -123.45,
        value: 1000.0 - 123.45,
        currency: 'EUR',
        unitPrice: (1000 - 123.45) / 1000,
        unitCount: 1000,
      },
      {
        type: 'UNVESTED_WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 0,
        currency: 'EUR',
        unitCount: 0,
        unitPrice: (1000 - 123.45) / 1000,
      },
      {
        type: 'WORK_COMPENSATION',
        contributions: 0,
        profit: 0,
        value: 200,
        unitCount: 200 / 1.23,
        unitPrice: 1.23,
        currency: 'EUR',
      },
      {
        type: 'MEMBERSHIP_BONUS',
        contributions: 1.23,
        profit: 0,
        value: 1.23,
        currency: 'EUR',
        unitPrice: 1.23,
        unitCount: 1,
      },
    ]);
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

    const amountInput = await screen.findByLabelText(/Kui palju liikmekapitali müüd?/i);
    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(await screen.findByText(/Allkirjastan lepingu/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/100.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('TOTAL', /Müüdav liikmekapital/i, /100.00 €/i);
    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /rahaline panus/i, /81.33 €/i);
    await assertMemberCapitalAmount('MEMBERSHIP_BONUS', /liikmeboonus/i, /0.11 €/i);
    await assertMemberCapitalAmount('WORK_COMPENSATION', /tööpanus/i, /18.56 €/i);

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

  test('allows to create transfer with custom breakdown', async () => {
    expect(await screen.findByText(/Liikmekapitali üleandmise avaldus/i)).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Sisesta ostja isikukood/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Otsin/i));

    expect(await screen.findByText(/Sellele isikukoodile vastab/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva ühistu liige #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Kinnitan ostja/i));

    const workCompensationAmountInput = await screen.findByLabelText(/Müüdav osa tööpanusest/i);
    const memberCapitalAmountInput = await screen.findByLabelText(/Müüdav osa rahaline panusest/i);

    userEvent.clear(workCompensationAmountInput);
    userEvent.clear(memberCapitalAmountInput);
    userEvent.type(workCompensationAmountInput, '150');
    userEvent.type(memberCapitalAmountInput, '100');

    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);
    userEvent.type(priceInput, '350');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(await screen.findByText(/Allkirjastan lepingu/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/350.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('TOTAL', /Müüdav liikmekapital/i, /250.00 €/i);
    await assertMemberCapitalAmount('WORK_COMPENSATION', /tööpanus/i, /150.00 €/i);
    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /rahaline panus/i, /100.00 €/i);

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

    const amountInput = await screen.findByLabelText(/Kui palju liikmekapitali müüd?/i);
    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);

    userEvent.type(amountInput, '10000000');
    userEvent.type(priceInput, '2.5');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(
      await screen.findByText(/TODO Sul ei ole piisavalt liikmekapitali/i),
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

    const amountInput = await screen.findByLabelText(/Kui palju liikmekapitali müüd?/i);
    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);

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

    const amountInput = await screen.findByLabelText(/Kui palju liikmekapitali müüd?/i);
    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);

    userEvent.type(amountInput, '10');
    userEvent.type(priceInput, '2');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'INVALID_IBAN');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(amountInput).toBeInTheDocument();
  });
});

describe('member capital transfer creation single row', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server);
    userCapitalBackend(server, [
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 1000.0,
        profit: -123.45,
        value: 1000.0 - 123.45,
        currency: 'EUR',
        unitPrice: (1000 - 123.45) / 1000,
        unitCount: 1000,
      },
    ]);
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

    const amountInput = await screen.findByLabelText(/Kui palju liikmekapitali müüd?/i);
    const priceInput = await screen.findByLabelText(/Mis hinnaga müüd?/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Müüja pangakonto/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Lepingu eelvaatesse/i));

    expect(await screen.findByText(/Allkirjastan lepingu/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/100.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /(rahaline panus)/i);

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
});

const assertMemberCapitalAmount = async (
  type: CapitalType | 'TOTAL',
  titleRegex: RegExp,
  amountRegex?: RegExp,
) => {
  const container = await screen.findByTestId(`capital-row-${type}`);

  expect(await within(container).findByText(titleRegex)).toBeInTheDocument();

  if (amountRegex) {
    expect(await within(container).findByText(amountRegex)).toBeInTheDocument();
  }
};
