import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { useTestBackends } from '../../../test/backend';
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

    useTestBackends(server);

    initializeComponent();

    history.push('/2nd-pillar-payment-rate');
  });

  test('payment rate changing page is shown', async () => {
    expect(await title()).toBeInTheDocument();
  });

  test('renders Currently tag for the active pending payment rate', async () => {
    expect(await title()).toBeInTheDocument();
    expect(await twoPercentOptionWithCurrentlyBadge()).toBeInTheDocument();
  });

  test('defaults to 6% selection even when current rate is 2%', async () => {
    expect(await title()).toBeInTheDocument();

    const [twoPercent, fourPercent, sixPercent] = screen.getAllByRole('radio');
    expect(twoPercent).not.toBeChecked();
    expect(fourPercent).not.toBeChecked();
    expect(sixPercent).toBeChecked();

    expect(await signButton()).toBeEnabled();
  });

  test('disables sign button when user manually selects their current rate', async () => {
    expect(await title()).toBeInTheDocument();

    userEvent.click(await twoPercentOption());

    expect(await signButton()).toBeDisabled();
  });

  test('can choose a different payment rate', async () => {
    expect(await title()).toBeInTheDocument();

    userEvent.click(await fourPercentOption());

    expect(await signButton()).toBeEnabled();
  });

  test('can change 2nd pillar payment rate', async () => {
    expect(await title()).toBeInTheDocument();

    userEvent.click(await fourPercentOption());
    userEvent.click(await signButton());

    expect(await allDone()).toBeInTheDocument();
  }, 20_000);

  test('can see new payment rate and fulfillment date on the success screen', async () => {
    expect(await title()).toBeInTheDocument();

    userEvent.click(await fourPercentOption());
    userEvent.click(await signButton());

    expect(await allDone()).toBeInTheDocument();
    expect(await paymentRateFulfillmentDate()).toBeInTheDocument();
    expect(await newPaymentRate()).toBeInTheDocument();
  }, 20_000);

  const title = () => screen.findByText('Increase your II pillar tax benefits');
  const twoPercentOption = () => screen.findByText('2% of Gross Salary');
  const twoPercentOptionWithCurrentlyBadge = () =>
    screen.findByRole('radio', { name: /2% of Gross Salary.*Current choice/i });
  const fourPercentOption = () => screen.findByText('4% of Gross Salary');
  const signButton = () => screen.findByRole('button', { name: 'Sign and send' });
  const allDone = () =>
    screen.findByRole(
      'heading',
      { name: 'You increased your II pillar contribution' },
      { timeout: 10_000 },
    );
  const paymentRateFulfillmentDate = () => screen.findByText('January 1, 2025');
  const newPaymentRate = () => screen.findByText('4%');
});
