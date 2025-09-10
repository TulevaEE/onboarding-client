import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
  capitalTransferContractBackend,
  memberCapitalListingsBackend,
  useTestBackendsExcept,
} from '../../test/backend';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { mockUser } from '../../test/backend-responses';
import {
  CapitalTransferContract,
  CapitalTransferContractState,
} from '../common/apiModels/capital-transfer';

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

  useTestBackendsExcept(server, ['memberCapitalListings', 'capitalTransferContract']);
  initializeComponent();

  history.push('/capital/listings');
});

describe('member capital listings with no listings', () => {
  beforeEach(() => {
    memberCapitalListingsBackend(server, []);
    capitalTransferContractBackend(server);
  });

  test('shows empty listings screen, allows to create listing', async () => {
    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Add listing/i);
    expect(createLink).toBeInTheDocument();

    userEvent.click(createLink);
    expect(await screen.findByText(/New listing/i)).toBeInTheDocument();

    const amountInput = await screen.findByLabelText(/How much member capital are you buying\?/i);
    const totalPriceInput = await screen.findByLabelText(/At what price are you buying\?/i);

    userEvent.type(amountInput, '100');
    userEvent.type(totalPriceInput, '250');

    userEvent.selectOptions(await screen.findByLabelText(/Listing will be visible for/i), '3');

    userEvent.click(screen.getByRole('button', { name: 'Publish purchase listing' }));

    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
  });
});

describe('member capital listings with listings', () => {
  beforeEach(() => {
    memberCapitalListingsBackend(server);
    capitalTransferContractBackend(server);
  });

  test('shows listings correctly', async () => {
    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Add listing/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    expect(await within(listings[0]).findByText('Purchase')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('#3')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('10 000.00 €')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('23 400.00 €')).toBeInTheDocument();
    expect((await within(listings[0]).findAllByText('Delete')).length).toBe(2);

    expect(await within(listings[1]).findByText('Purchase')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('#1')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('10.00 €')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('20.00 €')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('Contact buyer')).toBeInTheDocument();

    expect(await within(listings[2]).findByText('Sale')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('#2')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('100.00 €')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('250.00 €')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('Contact seller')).toBeInTheDocument();
  });

  test('allows to contact for BUY listing', async () => {
    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Add listing/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    userEvent.click(await within(listings[1]).findByText('Contact buyer'));

    expect(
      await screen.findByText(/The buyer will get an email with the following content/i),
    ).toBeInTheDocument();

    await waitFor(async () => expect(await screen.findByText(/Send to buyer/i)).toBeEnabled(), {
      timeout: 5000,
    });
    userEvent.click(await screen.findByText(/Send to buyer/i));

    expect(await screen.findByText(/Message sent/i, {}, { timeout: 3000 })).toBeInTheDocument();
    userEvent.click(await screen.findByText(/See all listings/i));

    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
  });

  test('allows to contact for SELL listing', async () => {
    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Add listing/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    userEvent.click(await within(listings[2]).findByText('Contact seller'));

    expect(
      await screen.findByText(/The seller will get an email with the following content/i),
    ).toBeInTheDocument();

    await waitFor(async () => expect(await screen.findByText(/Send to seller/i)).toBeEnabled(), {
      timeout: 5000,
    });
    userEvent.click(await screen.findByText(/Send to seller/i));

    expect(await screen.findByText(/Message sent/i, {}, { timeout: 3000 })).toBeInTheDocument();
    userEvent.click(await screen.findByText(/See all listings/i));

    expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
  });

  // TODO rewrite the test for new delete button with aria-label
  //
  // test('shows listings, allows to delete', async () => {
  //   expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();
  //   const createLink = await screen.findByText(/Add listing/i);
  //   expect(createLink).toBeInTheDocument();
  //
  //   const listings = await screen.findAllByTestId('listing');
  //
  //   const ownListing = listings[0];
  //
  //   userEvent.click(
  //     await within(ownListing).findByText('Delete', {
  //       selector: '[aria-expanded="false"]',
  //     }),
  //   );
  //
  //   expect(await screen.findByText(/Do you wish to delete your listing\?/i)).toBeInTheDocument();
  //
  //   userEvent.click(
  //     await within(ownListing).findByText('Delete', {
  //       selector: ':not([aria-expanded])',
  //     }),
  //   );
  //
  //   expect(
  //     await within(ownListing).findByText('Delete', {
  //       selector: '[aria-expanded="false"]',
  //     }),
  //   ).toBeInTheDocument();
  // });
});

describe('member capital listings with pending transactions', () => {
  beforeEach(() => {
    const states = [
      'CREATED',
      'SELLER_SIGNED',
      'BUYER_SIGNED',
      'PAYMENT_CONFIRMED_BY_BUYER',
      'PAYMENT_CONFIRMED_BY_SELLER',
      'APPROVED',
      'CANCELLED',
    ];
    const roles = ['BUYER', 'SELLER'];

    const contracts: CapitalTransferContract[] = states
      .map((state, stateIdx) =>
        roles.map((role, roleIdx) => {
          const id = Number(`${stateIdx}${roleIdx}`);

          if (role === 'BUYER') {
            return {
              id,
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
              transferAmounts: [{ type: 'CAPITAL_PAYMENT' as const, bookValue: 1000, price: 2000 }],
              state: state as CapitalTransferContractState,
              createdAt: '2025-07-21T07:00:00+0000',
              updatedAt: '2025-07-21T07:00:00+0000',
            };
          }

          return {
            id,
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
            transferAmounts: [{ type: 'CAPITAL_PAYMENT' as const, bookValue: 1000, price: 2000 }],
            state: state as CapitalTransferContractState,
            createdAt: '2025-07-21T07:00:00+0000',
            updatedAt: '2025-07-21T07:00:00+0000',
          };
        }),
      )
      .flat();
    memberCapitalListingsBackend(server);
    capitalTransferContractBackend(server, undefined, undefined, contracts);
  });

  test.each([
    ['BUYER', 'CREATED', 'Awaiting seller’s signature: Mairo Müüja', 'View'],
    ['BUYER', 'SELLER_SIGNED', 'Awaiting your signature', 'To signing'],
    ['BUYER', 'BUYER_SIGNED', 'Awaiting your payment', 'To making payment'],
    [
      'BUYER',
      'PAYMENT_CONFIRMED_BY_BUYER',
      'Awaiting seller’s confirmation of received payment: Mairo Müüja',
      'View',
    ],
    [
      'BUYER',
      'PAYMENT_CONFIRMED_BY_SELLER',
      'Awaiting decision from Tuleva cooperative’s board',
      'View',
    ],
    ['SELLER', 'CREATED', 'Awaiting your signature', 'To signing'],
    ['SELLER', 'SELLER_SIGNED', 'Awaiting buyer’s signature: Olev Ostja', 'View'],
    ['SELLER', 'BUYER_SIGNED', 'Awaiting buyer’s confirmation of payment: Olev Ostja', 'View'],
    [
      'SELLER',
      'PAYMENT_CONFIRMED_BY_BUYER',
      'Awaiting your confirmation about receiving payment',
      'To confirming',
    ],
    [
      'SELLER',
      'PAYMENT_CONFIRMED_BY_SELLER',
      'Awaiting decision from Tuleva cooperative’s board',
      'View',
    ],
  ])(
    'shows pending transaction correctly for %s in %s status',
    async (expectedRole, expectedState, statusText, linkText) => {
      expect(await screen.findByText(/Member capital transfer/i)).toBeInTheDocument();

      const contracts = await screen.findAllByTestId('active-capital-transfer-contract');

      // 10 contracts plus one from test backend
      const contractCount = 10 + 1;

      expect(contracts.length).toBe(contractCount);

      expect(
        await screen.findByText(`You have ${contractCount} pending applications`),
      ).toBeInTheDocument();

      let found = false;

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        const role = contract.getAttribute('data-myrole');
        const state = contract.getAttribute('data-state');

        if (role === expectedRole && state === expectedState) {
          found = true;

          expect(within(contract).getByText(new RegExp(statusText))).toBeInTheDocument();
          expect(within(contract).getByRole('link', { name: linkText })).toBeInTheDocument();
        }
      }

      if (!found) {
        throw new Error(`No transfer in state ${expectedState} for role ${expectedRole}`);
      }
    },
  );
});
