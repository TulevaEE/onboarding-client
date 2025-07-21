import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { capitalTransferContractBackend, useTestBackendsExcept } from '../../../../test/backend';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
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

  history.push('/capital/transfer/1');
});

describe('capital transfer buyer flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(
      server,
      {
        id: 1,
        seller: mockUser,
        buyer: mockUser,
        iban: 'EE_TEST_IBAN',
        unitPrice: 2,
        unitCount: 1000,
        unitsOfMemberBonus: 10,
        state: 'SELLER_SIGNED',
        createdAt: '2025-07-21T07:00:00+0000',
        updatedAt: '2025-07-21T07:00:00+0000',
      },
      'BUYER', // TODO correlate with /me endpoint
    );
  });
  test('allows buyer to sign and confirm', async () => {
    expect(await screen.findByText(/Lepingu andmed/i)).toBeInTheDocument();

    // TODO buyer seller assert

    expect(await screen.findByText(/1000 ühikut/i)).toBeInTheDocument();
    // TODO unitsOfMemberCapital assert

    userEvent.click(
      await screen.findByLabelText(
        /Kinnitan, et täidan võlaõigusseaduse kohaselt oma lepingulisi kohustusi täies ulatuses ja kohustun tasuma.+/i,
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

    expect(await screen.findByText(/Makse teostatud/i)).toBeInTheDocument();
  });
});

describe('capital transfer seller flow', () => {
  beforeEach(() => {
    capitalTransferContractBackend(
      server,
      {
        id: 1,
        seller: mockUser,
        buyer: mockUser,
        iban: 'EE_TEST_IBAN',
        unitPrice: 2,
        unitCount: 1000,
        unitsOfMemberBonus: 10,
        state: 'PAYMENT_CONFIRMED_BY_BUYER',
        createdAt: '2025-07-21T07:00:00+0000',
        updatedAt: '2025-07-21T07:00:00+0000',
      },
      'SELLER',
    );
  });
  // TODO enable when user on transfer logic sorted out
  xit('allows seller to confirm', async () => {
    expect(await screen.findByText(/Lepingu andmed/i)).toBeInTheDocument();

    userEvent.click(
      await screen.findByLabelText(/kätte saanud ja valmis liikmekapitali üle andma/i),
    );

    userEvent.click(await screen.findByText(/Kinnitan ja saadan avalduse/i));

    expect(
      await screen.findByText(/Tee pangaülekanne/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/EE_TEST_IBAN/i)).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/Kandsin üle.+/i));

    userEvent.click(await screen.findByText(/Kinnitan makse tegemist/i));

    expect(await screen.findByText(/Sinu poolt on kõik vajalik tehtud/i, {})).toBeInTheDocument();
    userEvent.click(await screen.findByText(/Vaatan staatust/i));

    expect(
      await screen.findByText(/Avaldus on saadetud Tuleva ühistu juhatusele/i),
    ).toBeInTheDocument();
  });
});
