import React from 'react';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  paymentLinkBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  secondPillarPaymentRateBackend,
  smartIdSigningBackend,
  userBackend,
  userConversionBackend,
} from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';

describe('When a user is changing their 2nd pillar payment rate', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

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

    userConversionBackend(server);
    userBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);
    applicationsBackend(server);
    returnsBackend(server);
    secondPillarPaymentRateBackend(server);
    smartIdSigningBackend(server);

    initializeComponent();

    history.push('/2nd-pillar-payment-rate');
  });

  test('payment rate changing page is shown', async () => {
    expect(await screen.findByText('II samba panuse muutmine')).toBeInTheDocument();
    const sign = await signButton();
    expect(sign).toBeDisabled();
  });

  test('can agree to the terms', async () => {
    expect(await screen.findByText('II samba panuse muutmine')).toBeInTheDocument();
    const sign = await signButton();
    const confirmationCheckbox = screen.getByRole('checkbox', { name: /I confirm/i });

    userEvent.click(confirmationCheckbox);

    expect(sign).toBeEnabled();
  });

  test('can change 2nd pillar payment rate', async () => {
    expect(await screen.findByText('II samba panuse muutmine')).toBeInTheDocument();
    const sign = await signButton();
    const confirmationCheckbox = screen.getByRole('checkbox', { name: /I confirm/i });

    userEvent.click(confirmationCheckbox);
    userEvent.click(sign);

    expect(
      await screen.findByRole('heading', { name: 'Muudatus tehtud' }, { timeout: 10_000 }),
    ).toBeInTheDocument();
  }, 20_000);

  const signButton = async () => screen.findByRole('button', { name: 'Sign and send mandate' });
});
