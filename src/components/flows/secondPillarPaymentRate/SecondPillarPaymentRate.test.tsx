import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { nudgeBackend, paymentRateRedirectBackend, useTestBackends } from '../../../test/backend';
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

  test('shows the account link on the success screen', async () => {
    history.push('/2nd-pillar-payment-rate-success');

    expect(await allDone()).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/account(\?language=en)?$/),
    );
  });

  test('shows the nudge the server decided on the success screen', async () => {
    nudgeBackend(server, { key: 'SECOND_PILLAR_TRANSFER', tag: 'nudge_second_pillar' });
    history.push('/2nd-pillar-payment-rate-success');

    expect(await allDone()).toBeInTheDocument();
    expect(
      await main().findByRole('link', { name: /Bring your II\spillar to Tuleva/ }),
    ).toHaveAttribute('href', '/2nd-pillar-flow');
  });

  test('shows no nudge on the success screen when the server decides on none', async () => {
    history.push('/2nd-pillar-payment-rate-success');

    expect(await allDone()).toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: /Bring your II\spillar to Tuleva/ }),
    ).not.toBeInTheDocument();
  });

  describe('when the page is the login landing of the payment rate experiment', () => {
    let trackedEvents: { type: string; data?: Record<string, unknown> }[];
    let redirectBackend: ReturnType<typeof paymentRateRedirectBackend>;

    beforeEach(() => {
      trackedEvents = [];
      redirectBackend = paymentRateRedirectBackend(server);
      server.use(
        rest.post('http://localhost/v1/t', (req, res, ctx) => {
          trackedEvents.push(req.body as { type: string });
          return res(ctx.json({}));
        }),
      );
      history.push('/2nd-pillar-payment-rate', {
        nudge: { arm: 'TREATMENT', seasonYear: 2026 },
      });
    });

    const eventsOfType = (type: string) => trackedEvents.filter((event) => event.type === type);

    const nudgeEventData = {
      context: 'PAYMENT_RATE_REDIRECT',
      key: 'SECOND_PILLAR_PAYMENT_RATE',
      tag: 'nudge_payment_rate',
      path: '/2nd-pillar-payment-rate',
      channel: 'SCREEN',
      arm: 'TREATMENT',
      seasonYear: 2026,
    };

    test('replaces the page introduction with the nudge copy', async () => {
      expect(await nudgeHeading()).toHaveClass('balancedHeading');
      expect(
        screen.getByText(
          /Your II\spillar is your own wealth, invested in your name and inheritable\./,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Right now you direct 2% of your salary there\. From January you can contribute up to 6% straight from your gross salary and your tax win grows up to threefold\./,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Submit your application by November\s30 at the latest to save more from the new year\./,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your choice takes effect on January\s1,\s2025\./),
      ).toBeInTheDocument();
      expect(screen.queryByText('Increase your II pillar tax benefits')).not.toBeInTheDocument();
    });

    test('offers a way out that is as visible as the action', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();

      expect(await notNowButton()).toHaveClass('btn-outline-primary');
      expect(await signButton()).toHaveClass('btn-primary');
    });

    test('takes the nudge out of the history so a reload shows the ordinary page', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();

      await waitFor(() => expect(history.location.state).toBeUndefined());
      expect(await nudgeHeading()).toBeInTheDocument();
      await waitFor(() => expect(eventsOfType('NUDGE_VIEW')).toHaveLength(1));
    });

    test('leaves no way back to the nudge once it is dismissed', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();
      const entriesOnTheNudge = history.length;

      userEvent.click(await notNowButton());

      await waitFor(() => expect(history.location.pathname).toBe('/account'));
      expect(history.length).toBe(entriesOnTheNudge);
    });

    test('records the dismissal and returns to the account page', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();

      userEvent.click(await notNowButton());

      await waitFor(() => expect(redirectBackend.dismissals()).toBe(1));
      await waitFor(() => expect(history.location.pathname).toBe('/account'));
    });

    test('tracks the view once with the arm it was given', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();

      await waitFor(() => expect(eventsOfType('NUDGE_VIEW')).toHaveLength(1));
      expect(eventsOfType('NUDGE_VIEW')[0]).toEqual({
        type: 'NUDGE_VIEW',
        data: nudgeEventData,
      });
    });

    test('tracks the click when the mandate is signed', async () => {
      expect(await nudgeHeading()).toBeInTheDocument();

      userEvent.click(await signButton());

      await waitFor(() => expect(eventsOfType('NUDGE_CLICK')).toHaveLength(1));
      expect(eventsOfType('NUDGE_CLICK')[0]).toEqual({
        type: 'NUDGE_CLICK',
        data: nudgeEventData,
      });
    }, 20_000);
  });

  test('shows no experiment copy when the page was opened on its own', async () => {
    expect(await title()).toBeInTheDocument();

    expect(screen.queryByText(/Your next logical step/)).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Cancel' })).toBeInTheDocument();
  });

  const main = () => within(screen.getByRole('main'));
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
  const nudgeHeading = () =>
    screen.findByRole('heading', {
      name: /Your next logical step: contribute more to your II\spillar/,
    });
  const notNowButton = () => screen.findByRole('button', { name: 'Not now' });
  const newPaymentRate = () => screen.findByText('4%');
});
