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
  CapitalTransferAmount,
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
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    userEvent.click(createLink);
    expect(await screen.findByText(/Uus kuulutus/i)).toBeInTheDocument();

    const totalUnitsInput = (await screen.findByLabelText(
      /Sul on liikmekapitali kogumahus/i,
    )) as HTMLInputElement;

    expect(totalUnitsInput).toBeInTheDocument();
    expect(totalUnitsInput.value).toBe('1001');

    const totalBookValueInput = (await screen.findByLabelText(/Väärtusega/i)) as HTMLInputElement;

    expect(totalBookValueInput).toBeInTheDocument();
    expect(totalBookValueInput.value).toBe('877.78'); // nonsensical value from capital endpoint mock

    const amountInput = await screen.findByLabelText(/Ostan kogumahule juurde/i);
    const totalPriceInput = await screen.findByLabelText(/Hinnaga/i);

    userEvent.type(amountInput, '100');
    userEvent.type(totalPriceInput, '250');

    userEvent.selectOptions(await screen.findByLabelText(/Kuulutuse kestus kuudes/i), '3');

    userEvent.click(screen.getByRole('button', { name: 'Avaldan ostukuulutuse' }));

    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
  });
});

describe('member capital listings with listings', () => {
  beforeEach(() => {
    memberCapitalListingsBackend(server);
    capitalTransferContractBackend(server);
  });

  test('shows listings correctly', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    expect(await within(listings[0]).findByText('Ost')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('#1')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('10')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('20.00 €')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('Soovin müüa')).toBeInTheDocument();

    expect(await within(listings[1]).findByText('Müük')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('#2')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('100')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('250.00 €')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('Soovin osta')).toBeInTheDocument();

    expect(await within(listings[2]).findByText('Ost')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('#3')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('10 000')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('23 400.00 €')).toBeInTheDocument();
    expect((await within(listings[2]).findAllByText('Kustutan')).length).toBe(2);
  });

  test('allows to contact for BUY listing', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    userEvent.click(await within(listings[0]).findByText('Soovin müüa'));

    expect(await screen.findByText(/Ostja saab järgneva sisuga meili/i)).toBeInTheDocument();

    await waitFor(async () => expect(await screen.findByText(/Saadan ostjale/i)).toBeEnabled(), {
      timeout: 5000,
    });
    userEvent.click(await screen.findByText(/Saadan ostjale/i));

    expect(
      await screen.findByText(/Sõnum on saadetud/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    userEvent.click(await screen.findByText(/Vaatan kõiki kuulutusi/i));

    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
  });

  test('allows to contact for SELL listing', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    userEvent.click(await within(listings[1]).findByText('Soovin osta'));

    expect(await screen.findByText(/Müüja saab järgneva sisuga meili/i)).toBeInTheDocument();

    await waitFor(async () => expect(await screen.findByText(/Saadan müüjale/i)).toBeEnabled(), {
      timeout: 5000,
    });
    userEvent.click(await screen.findByText(/Saadan müüjale/i));

    expect(
      await screen.findByText(/Sõnum on saadetud/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    userEvent.click(await screen.findByText(/Vaatan kõiki kuulutusi/i));

    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
  });

  test('shows listings, allows to delete', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    const ownListing = listings[2];

    userEvent.click(
      await within(ownListing).findByText('Kustutan', {
        selector: '[aria-expanded="false"]',
      }),
    );

    expect(await screen.findByText(/Soovid oma kuulutuse kustutada?/i)).toBeInTheDocument();

    userEvent.click(
      await within(ownListing).findByText('Kustutan', {
        selector: ':not([aria-expanded])',
      }),
    );

    expect(
      await within(ownListing).findByText('Kustutan', {
        selector: '[aria-expanded="false"]',
      }),
    ).toBeInTheDocument();
  });
});

describe('member capital listings with pending tranactions', () => {
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
              transferAmounts: [{ type: 'CAPITAL_PAYMENT' as const, units: 1000, price: 2000 }],
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
            transferAmounts: [{ type: 'CAPITAL_PAYMENT' as const, units: 1000, price: 2000 }],
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
    ['BUYER', 'CREATED', 'Müüja allkirja ootel: Mairo Müüja', 'Vaatan'],
    ['BUYER', 'SELLER_SIGNED', 'Sinu allkirja ootel', 'Allkirjastama'],
    ['BUYER', 'BUYER_SIGNED', 'Sinu makse tegemise ootel', 'Makset tegema'],
    ['BUYER', 'PAYMENT_CONFIRMED_BY_BUYER', 'Müüja maksekinnituse ootel: Mairo Müüja', 'Vaatan'],
    ['BUYER', 'PAYMENT_CONFIRMED_BY_SELLER', 'Tuleva ühistu juhatuse otsuse ootel', 'Vaatan'],
    ['SELLER', 'CREATED', 'Sinu allkirja ootel', 'Allkirjastama'],
    ['SELLER', 'SELLER_SIGNED', 'Ostja allkirja ootel: Olev Ostja', 'Vaatan'],
    ['SELLER', 'BUYER_SIGNED', 'Ostja maksekinnituse ootel: Olev Ostja', 'Vaatan'],
    [
      'SELLER',
      'PAYMENT_CONFIRMED_BY_BUYER',
      'Sinu kinnituse ootel raha laekumise kohta',
      'Kinnitama',
    ],
    ['SELLER', 'PAYMENT_CONFIRMED_BY_SELLER', 'Tuleva ühistu juhatuse otsuse ootel', 'Vaatan'],
  ])(
    'shows pending transaction correctly for %s in %s status',
    async (expectedRole, expectedState, statusText, linkText) => {
      expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();

      const contracts = await screen.findAllByTestId('active-capital-transfer-contract');

      // 10 contracts plus one from test backend
      const contractCount = 10 + 1;

      expect(contracts.length).toBe(contractCount);

      expect(
        await screen.findByText(`Sul on ${contractCount} pooleliolevat avaldust`),
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
