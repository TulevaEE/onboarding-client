import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { capitalTransferContractBackend, useTestBackendsExcept } from '../../../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { mockUser } from '../../../../test/backend-responses';
import { getFullName } from '../../../common/utils';
import { getBuyerDetailsSection, getSellerDetailsSection } from '../testUtils';

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

  history.push('/capital/transfer/1');
});

describe('capital transfer buyer flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server, {
      contract: {
        id: 1,
        seller: {
          id: 1,
          memberNumber: 10,
          firstName: 'Mairo',
          lastName: 'Müüja',
          personalCode: '30303039914',
        },
        buyer: {
          id: 2,
          memberNumber: mockUser.memberNumber as number,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          personalCode: mockUser.personalCode,
        },
        iban: 'EE_TEST_IBAN',
        transferAmounts: [{ type: 'CAPITAL_PAYMENT', bookValue: 1000, price: 2000 }],
        state: 'SELLER_SIGNED',
        createdAt: '2025-07-21T07:00:00+0000',
        updatedAt: '2025-07-21T07:00:00+0000',
      },
      currentRole: 'BUYER', // TODO correlate with /me endpoint
    });
  });
  test('allows buyer to sign and confirm', async () => {
    const buyerSection = await screen.findByTestId('buyer-details');
    expect(await within(buyerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(buyerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Awaiting your signature/i)).toBeInTheDocument();

    const sellerSection = await screen.findByTestId('seller-details');
    expect(await within(sellerSection).findByText(/Mairo Müüja/i)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Signed/i)).toBeInTheDocument();

    expect(await screen.findByText(/1.000.00.€/i)).toBeInTheDocument();
    // TODO unitsOfMemberCapital assert

    userEvent.click(
      await screen.findByLabelText(
        /I confirm that the seller and the buyer have agreed to the transfer of member capital under the above-mentioned conditions./i,
      ),
    );

    userEvent.click(await screen.findByRole('button', { name: /Sign application/i }, {}));

    expect(
      await screen.findByText(/Make a bank transfer/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/EE_TEST_IBAN/i)).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/I transferred.+/i));

    userEvent.click(await screen.findByRole('button', { name: /Confirm payment/i }, {}));

    expect(
      await screen.findByText(/Everything required from you has been completed/i, {}),
    ).toBeInTheDocument();
    userEvent.click(await screen.findByText(/View status/i));

    expect(
      await within(await getSellerDetailsSection()).findByText(/Awaiting payment confirmation/i),
    ).toBeInTheDocument();
    expect(
      await within(await getBuyerDetailsSection()).findByText(/Payment made/i),
    ).toBeInTheDocument();
  });
});

describe('capital transfer seller flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server, {
      contract: {
        id: 1,
        buyer: {
          id: 1,
          memberNumber: 10,
          firstName: 'Olev',
          lastName: 'Ostja',
          personalCode: '30303039914',
        },
        seller: {
          id: 2,
          memberNumber: mockUser.memberNumber as number,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          personalCode: mockUser.personalCode,
        },
        iban: 'EE_TEST_IBAN',
        transferAmounts: [{ type: 'CAPITAL_PAYMENT', bookValue: 1000, price: 2000 }],
        state: 'PAYMENT_CONFIRMED_BY_BUYER',
        createdAt: '2025-07-21T07:00:00+0000',
        updatedAt: '2025-07-21T07:00:00+0000',
      },
      currentRole: 'SELLER',
    });
  });
  test('allows seller to confirm', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Signed/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Payment made/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Signed/i)).toBeInTheDocument();
    expect(
      await within(sellerSection).findByText(/Awaiting payment confirmation/i),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/and am ready to transfer the member capital/i));

    userEvent.click(await screen.findByText(/Confirm and submit application/i));

    expect(
      await screen.findByText(
        /The application has been submitted to the Tuleva cooperative board/i,
      ),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/View status/i));

    expect(
      await within(await getSellerDetailsSection()).findByText(/Payment received/i, {}),
    ).toBeInTheDocument();
  });
});

describe('capital transfer seller flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(server, {
      contract: {
        id: 1,
        buyer: {
          id: 1,
          memberNumber: 10,
          firstName: 'Olev',
          lastName: 'Ostja',
          personalCode: '30303039914',
        },
        seller: {
          id: 2,
          memberNumber: mockUser.memberNumber as number,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          personalCode: mockUser.personalCode,
        },
        iban: 'EE_TEST_IBAN',
        transferAmounts: [{ type: 'CAPITAL_PAYMENT', bookValue: 1000, price: 2000 }],
        state: 'BUYER_SIGNED',
        createdAt: '2025-07-21T07:00:00+0000',
        updatedAt: '2025-07-21T07:00:00+0000',
      },
      currentRole: 'SELLER',
    });
  });
  test('allows seller to check status when payment not confirmed by buyer', async () => {
    expect(
      await screen.findByText(/Application for transfer of member capital/i),
    ).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Signed/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Signed/i)).toBeInTheDocument();
  });
});
