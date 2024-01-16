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
  mandateDeadlinesBackend,
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
    mandateDeadlinesBackend(server);

    initializeComponent();

    history.push('/2nd-pillar-payment-rate');
  });

  test('payment rate changing page is shown', async () => {
    expect(await title()).toBeInTheDocument();
  });

  test('renders Currently tag for the active pending payment rate', async () => {
    expect(await title()).toBeInTheDocument();

    const paymentRateOption = screen.getByText('2% of Gross Salary');

    // eslint-disable-next-line testing-library/no-node-access
    const currently = paymentRateOption.closest('h3')?.querySelector('.badge');
    expect(currently).toBeInTheDocument();
    expect(currently).toHaveTextContent('Current choice');
  });

  test('can not change 2nd pillar payment rate to the same rate', async () => {
    expect(await title()).toBeInTheDocument();
    const sign = await signButton();
    expect(sign).toBeDisabled();
  });

  test('can choose a different payment rate', async () => {
    expect(await title()).toBeInTheDocument();
    const fourPercent = await fourPercentOption();
    const sign = await signButton();

    userEvent.click(fourPercent);

    expect(sign).toBeEnabled();
  });

  test('can change 2nd pillar payment rate', async () => {
    expect(await title()).toBeInTheDocument();
    const fourPercent = await fourPercentOption();
    const sign = await signButton();

    userEvent.click(fourPercent);
    userEvent.click(sign);

    expect(await allDone()).toBeInTheDocument();
  }, 20_000);

  test('can see new payment rate and fulfillment date on the success screen', async () => {
    expect(await title()).toBeInTheDocument();
    const fourPercent = await fourPercentOption();
    const sign = await signButton();

    userEvent.click(fourPercent);
    userEvent.click(sign);

    expect(await allDone()).toBeInTheDocument();
    expect(await paymentRateFulfillmentDate()).toBeInTheDocument();
    expect(await newPaymentRate()).toBeInTheDocument();
  }, 20_000);

  const title = () => screen.findByText('II pillar contribution change');
  const fourPercentOption = async () => screen.findByText('4% of Gross Salary');
  const signButton = async () => screen.findByRole('button', { name: 'Sign and send' });
  const allDone = async () =>
    screen.findByRole('heading', { name: 'All done' }, { timeout: 10_000 });
  const paymentRateFulfillmentDate = () => screen.findByText('January 1, 2025');
  const newPaymentRate = () => screen.findByText('4%');
});
