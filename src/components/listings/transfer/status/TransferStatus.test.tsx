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
    capitalTransferContractBackend(
      server,
      {
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
      'BUYER', // TODO correlate with /me endpoint
    );
  });
  test('allows buyer to sign and confirm', async () => {
    expect(await screen.findByText(/Lepingu andmed/i)).toBeInTheDocument();

    const buyerSection = await screen.findByTestId('buyer-details');
    expect(await within(buyerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(buyerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Sinu allkirja ootel/i)).toBeInTheDocument();

    const sellerSection = await screen.findByTestId('seller-details');
    expect(await within(sellerSection).findByText(/Mairo Müüja/i)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Allkirjastatud/i)).toBeInTheDocument();

    expect(await screen.findByText(/1.000.00.€/i)).toBeInTheDocument();
    // TODO unitsOfMemberCapital assert

    userEvent.click(
      await screen.findByLabelText(
        /Kinnitan, et müüja ja ostja on kokku leppinud liikmekapitali võõrandamises eelpool nimetatud tingimustel./i,
      ),
    );

    userEvent.click(await screen.findByText(/Allkirjastan lepingu/i));

    expect(
      await screen.findByText(/Tee pangaülekanne/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/EE_TEST_IBAN/i)).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/Kandsin üle.+/i));

    userEvent.click(await screen.findByText(/Kinnitan makse tegemist/i));

    expect(await screen.findByText(/Sinu poolt on kõik vajalik tehtud/i, {})).toBeInTheDocument();
    userEvent.click(await screen.findByText(/Vaatan staatust/i));

    expect(
      await within(await getSellerDetailsSection()).findByText(/Maksekinnituse ootel/i),
    ).toBeInTheDocument();
    expect(
      await within(await getBuyerDetailsSection()).findByText(/Makse teostatud/i),
    ).toBeInTheDocument();
  });
});

describe('capital transfer seller flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(
      server,
      {
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
      'SELLER',
    );
  });
  test('allows seller to confirm', async () => {
    expect(await screen.findByText(/Lepingu andmed/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Allkirjastatud/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Makse teostatud/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Allkirjastatud/i)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Maksekinnituse ootel/i)).toBeInTheDocument();

    userEvent.click(
      await screen.findByLabelText(/kätte saanud ja valmis liikmekapitali üle andma/i),
    );

    userEvent.click(await screen.findByText(/Kinnitan ja saadan avalduse/i));

    expect(
      await screen.findByText(/Avaldus on saadetud Tuleva ühistu juhatusele/i),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByText(/Vaatan staatust/i));

    expect(
      await within(await getSellerDetailsSection()).findByText(/Makse teostatud/i, {}),
    ).toBeInTheDocument();
  });
});

describe('capital transfer seller flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(
      server,
      {
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
      'SELLER',
    );
  });
  test('allows seller to check status when payment not confirmed by buyer', async () => {
    expect(await screen.findByText(/Lepingu andmed/i)).toBeInTheDocument();

    const buyerSection = await getBuyerDetailsSection();
    expect(await within(buyerSection).findByText(/Olev Ostja/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/30303039914/i)).toBeInTheDocument();
    expect(await within(buyerSection).findByText(/Allkirjastatud/i)).toBeInTheDocument();

    const sellerSection = await getSellerDetailsSection();
    expect(await within(sellerSection).findByText(getFullName(mockUser))).toBeInTheDocument();
    expect(await within(sellerSection).findByText(mockUser.personalCode)).toBeInTheDocument();
    expect(await within(sellerSection).findByText(/Allkirjastatud/i)).toBeInTheDocument();
  });
});
