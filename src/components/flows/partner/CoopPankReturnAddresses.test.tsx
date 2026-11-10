import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, loginThroughPartner, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackends } from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';

const SINGLE_PAYMENT_RETURN_ADDRESS = '/3rd-pillar-success';
const STANDING_ORDER_RETURN_ADDRESS = '/3rd-pillar-payment/recurring-confirmation?confirmed=true';

describe('The return addresses Coop Pank hardcodes after a payment, which must never change', () => {
  const server = setupServer();
  let history: History;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
  });

  const arriveFromCoopPankAt = (address: string) => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    loginThroughPartner(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
    history.push(address);
  };

  test('confirm a single payment', async () => {
    arriveFromCoopPankAt(SINGLE_PAYMENT_RETURN_ADDRESS);

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
  });

  test('confirm a standing order', async () => {
    arriveFromCoopPankAt(STANDING_ORDER_RETURN_ADDRESS);

    expect(
      await screen.findByRole('heading', { name: 'Recurring payment set up' }),
    ).toBeInTheDocument();
  });
});
