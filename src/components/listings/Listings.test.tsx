import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { memberCapitalListingsBackend, useTestBackendsExcept } from '../../test/backend';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';

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

  useTestBackendsExcept(server, ['memberCapitalListings']);
  initializeComponent();

  history.push('/capital/listings');
});

describe('member capital listings with no listings', () => {
  beforeEach(() => {
    memberCapitalListingsBackend(server, []);
  });

  test('shows empty listings screen, allows to create listing', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    userEvent.click(createLink);
    expect(await screen.findByText(/Uus kuulutus/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sul on hetkel liikmekapitali/i)).toBeInTheDocument();
    expect(await screen.findByText(/877.78/i)).toBeInTheDocument();

    const amountInput = await screen.findByLabelText(/Ühikute arv/i);
    const priceInput = await screen.findByLabelText(/Ühiku hind/i);

    userEvent.type(amountInput, '100');
    userEvent.type(priceInput, '2.5');

    expect(screen.getByDisplayValue('250')).toBeInTheDocument();

    userEvent.selectOptions(await screen.findByLabelText(/Kuulutuse kestus kuudes/i), '3');

    userEvent.click(screen.getByRole('button', { name: 'Avaldan ostukuulutuse' }));

    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
  });
});

describe('member capital listings with listings', () => {
  beforeEach(() => {
    memberCapitalListingsBackend(server);
  });

  test('shows listings, allows to contact', async () => {
    expect(await screen.findByText(/Liikmekapitali kuulutused/i)).toBeInTheDocument();
    const createLink = await screen.findByText(/Lisan kuulutuse/i);
    expect(createLink).toBeInTheDocument();

    const listings = await screen.findAllByTestId('listing');

    expect(listings.length).toBe(3);

    expect(await within(listings[0]).findByText('Ost #1')).toBeInTheDocument();
    expect(await within(listings[0]).findByText('10')).toBeInTheDocument();
    expect(await within(listings[0]).findByText(/2\.00.€/i)).toBeInTheDocument();
    expect(await within(listings[0]).findByText('Soovin osta')).toBeInTheDocument();

    expect(await within(listings[1]).findByText('Müük #2')).toBeInTheDocument();
    expect(await within(listings[1]).findByText('100')).toBeInTheDocument();
    expect(await within(listings[1]).findByText(/2\.50.€/i)).toBeInTheDocument();
    expect(await within(listings[1]).findByText('Soovin müüa')).toBeInTheDocument();

    expect(await within(listings[2]).findByText('Ost #3')).toBeInTheDocument();
    expect(await within(listings[2]).findByText('10 000')).toBeInTheDocument();
    expect(await within(listings[2]).findByText(/2\.34.€/i)).toBeInTheDocument();
    expect((await within(listings[2]).findAllByText('Kustutan')).length).toBe(2);

    userEvent.click(await within(listings[0]).findByText('Soovin osta'));

    expect(await screen.findByText(/Sõnum ostjale/i)).toBeInTheDocument();
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
