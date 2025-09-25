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
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const amountInput = await screen.findByLabelText(/How much member capital are you selling\?/i);
    const priceInput = await screen.findByLabelText(/Agreed sale price/i);

    userEvent.type(amountInput, '1077.78');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    expect(await screen.findByText(/Citadele/)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Preview application/i));

    expect(
      await screen.findByRole('button', { name: /Sign application/i }, {}),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/Citadele/)).toBeInTheDocument();

    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('TOTAL', /Member capital to be sold/i, /1 077.78 €/i);
    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /monetary contribution/i, /876.55 €/i);
    await assertMemberCapitalAmount('WORK_COMPENSATION', /work contribution/i, /200.00 €/i);
    await assertMemberCapitalAmount('MEMBERSHIP_BONUS', /membership bonus/i, /1.23 €/i);

    userEvent.click(
      await screen.findByLabelText(
        /I confirm that the seller and the buyer have agreed to the transfer of member capital under the above-mentioned conditions./i,
      ),
    );

    userEvent.click(await screen.findByRole('button', { name: /Sign application/i }, {}));

    expect(
      await screen.findByText(/The application has been signed/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/View status/i));

    expect(await screen.findByText(/Signed/i)).toBeInTheDocument();
    expect(await screen.findByText(/Awaiting/i)).toBeInTheDocument();
  });

  test('allows to create transfer with custom breakdown', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const workCompensationAmountInput = await screen.findByLabelText(/Work contribution/i);
    const memberCapitalAmountInput = await screen.findByLabelText(/Monetary contribution/i);

    userEvent.clear(workCompensationAmountInput);
    userEvent.clear(memberCapitalAmountInput);
    userEvent.type(workCompensationAmountInput, '150');
    userEvent.type(memberCapitalAmountInput, '100');

    const priceInput = await screen.findByLabelText(/Agreed sale price/i);
    userEvent.type(priceInput, '350');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Preview application/i));

    expect(
      await screen.findByRole('button', { name: /Sign application/i }, {}),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/350.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('TOTAL', /Member capital to be sold/i, /250.00 €/i);
    await assertMemberCapitalAmount('WORK_COMPENSATION', /work contribution/i, /150.00 €/i);
    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /monetary contribution/i, /100.00 €/i);

    userEvent.click(
      await screen.findByLabelText(
        /I confirm that the seller and the buyer have agreed to the transfer of member capital under the above-mentioned conditions./i,
      ),
    );

    userEvent.click(await screen.findByRole('button', { name: /Sign application/i }, {}));

    expect(
      await screen.findByText(/The application has been signed/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/View status/i));

    expect(await screen.findByText(/Signed/i)).toBeInTheDocument();
    expect(await screen.findByText(/Awaiting buyer.s signature/i)).toBeInTheDocument();
  });

  test('does not allow to create without selected member', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039913');

    userEvent.click(await screen.findByText(/Search/i));

    expect(
      await screen.findByText(/No Tuleva cooperative member matches this personal ID code./i),
    ).toBeInTheDocument();
  });

  test('does not allow to create with invalid amount', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const amountInput = await screen.findByLabelText(/How much member capital are you selling\?/i);
    const priceInput = await screen.findByLabelText(/Agreed sale price/i);

    userEvent.type(amountInput, '10000000');
    userEvent.type(priceInput, '2.5');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveValue('1077.78000');
  });

  test('does not allow to create with invalid iban', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const amountInput = await screen.findByLabelText(/How much member capital are you selling\?/i);
    const priceInput = await screen.findByLabelText(/Agreed sale price/i);

    userEvent.type(amountInput, '10');
    userEvent.type(priceInput, '2');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'INVALID_IBAN');

    userEvent.click(await screen.findByText(/Preview application/i));

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
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const amountInput = await screen.findByLabelText(/How much member capital are you selling\?/i);
    const priceInput = await screen.findByLabelText(/Agreed sale price/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(await screen.findByText(/Preview application/i));

    expect(
      await screen.findByRole('button', { name: /Sign application/i }, {}),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/100.00 €/i)).toBeInTheDocument();
    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('CAPITAL_PAYMENT', /(monetary contribution)/i);

    userEvent.click(
      await screen.findByLabelText(
        /I confirm that the seller and the buyer have agreed to the transfer of member capital under the above-mentioned conditions./i,
      ),
    );

    userEvent.click(await screen.findByRole('button', { name: /Sign application/i }, {}));

    expect(
      await screen.findByText(/The application has been signed/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/View status/i));

    expect(await screen.findByText(/Signed/i)).toBeInTheDocument();
    expect(await screen.findByText(/Awaiting buyer.s signature/i)).toBeInTheDocument();
  });
});

describe('member capital transfer creation with precise values', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server, {
      expectedBookValues: {
        CAPITAL_PAYMENT: 1000.4400123,
      },
    });
    userCapitalBackend(server, [
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 1000.0,
        profit: 0,
        value: 1000.4400123,
        currency: 'EUR',
        unitPrice: 1,
        unitCount: 1000.4400123,
      },
    ]);
  });

  test('allows to create transfer that liquidates to second', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const personalCodeInput = await screen.findByLabelText(/Enter buyer’s personal ID code/i);
    userEvent.type(personalCodeInput, '30303039914');

    userEvent.click(await screen.findByText(/Search/i));

    expect(await screen.findByText(/This personal ID code matches/i)).toBeInTheDocument();
    expect(await screen.findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tuleva cooperative member #9999/i)).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: /Confirm buyer/i }, {}));

    const amountInput = await screen.findByLabelText(/How much member capital are you selling\?/i);
    const priceInput = await screen.findByLabelText(/Agreed sale price/i);

    userEvent.type(amountInput, '1000.44');
    userEvent.type(priceInput, '250');

    const ibanInput = await screen.findByLabelText(/Seller’s bank account \(IBAN\)/i);
    userEvent.type(ibanInput, 'EE591254471322749514');

    expect(await screen.findByText(/Citadele/)).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Preview application/i));

    expect(
      await screen.findByRole('button', { name: /Sign application/i }, {}),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();

    expect(await screen.findByText(/Citadele/)).toBeInTheDocument();

    expect(await screen.findByText(/250.00 €/i)).toBeInTheDocument();

    await assertMemberCapitalAmount('TOTAL', /Member capital to be sold/i, /1 000.44 €/i);

    userEvent.click(
      await screen.findByLabelText(
        /I confirm that the seller and the buyer have agreed to the transfer of member capital under the above-mentioned conditions./i,
      ),
    );

    userEvent.click(await screen.findByRole('button', { name: /Sign application/i }, {}));

    expect(
      await screen.findByText(/The application has been signed/i, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/View status/i));

    expect(await screen.findByText(/Signed/i)).toBeInTheDocument();
    expect(await screen.findByText(/Awaiting/i)).toBeInTheDocument();
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
