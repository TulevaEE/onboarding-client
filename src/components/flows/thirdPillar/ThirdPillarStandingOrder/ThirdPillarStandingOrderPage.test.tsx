import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { QueryClient } from '@tanstack/react-query';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

const server = setupServer();
let history: History;
let trackedEvents: unknown[];

const TAX_REFUND =
  'You get 22% income tax back on every contribution, up to 15% of your gross income for the calendar year and on at most 6,000 euros a year.';

const withoutStepNumber = (step: HTMLElement) =>
  (step.textContent ?? '').replace(/\s+/g, ' ').replace(/^\d+/, '');

const stepsTitled = (title: string) =>
  within(screen.getByRole('list', { name: title }))
    .getAllByRole('listitem')
    .map(withoutStepNumber)
    .map((step) => ({
      text: step.replace(TAX_REFUND, ''),
      remindsOfTaxRefund: step.includes(TAX_REFUND),
    }));

function openPage(language: 'en' | 'et' = 'en', search = '') {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(
    <Route path="" component={LoggedInApp} />,
    history as any,
    store,
    new QueryClient(),
    language,
  );
  history.push({ pathname: '/3rd-pillar-recurring-payment', search });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  trackedEvents = [];
  useTestBackendsExcept(server, ['trackedEvents']);
  server.use(
    rest.post('http://localhost/v1/t', (req, res, ctx) => {
      trackedEvents.push(req.body);
      return res(ctx.json({}));
    }),
  );
});

describe('a person who wants to change their III pillar recurring payment', () => {
  test('is asked which bank the payment goes from', async () => {
    openPage();

    expect(
      await screen.findByRole('heading', { name: /^Change your III\spillar recurring payment$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can change your recurring payment at your bank, where the payments are made.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Swedbank' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Other bank' })).not.toBeChecked();
    await waitFor(() => expect(document.title).toMatch(/^III\spillar recurring payment – Tuleva$/));
  });

  test('who pays from Swedbank ends the old payment, then sets up a new one with the new amount', async () => {
    openPage();

    userEvent.click(await screen.findByRole('radio', { name: 'Swedbank' }));

    expect(stepsTitled('End your old payment, then set up a new one')).toEqual([
      {
        text: 'In the list of regular payments to the third pillar, click the fund name of your current payment and end it.',
        remindsOfTaxRefund: false,
      },
      {
        text: 'Then choose to make regular contributions, pick Tuleva III Samba Pensionifond as the fund, enter the new amount and confirm.',
        remindsOfTaxRefund: true,
      },
    ]);
  });

  test.each([
    ['SEB', 'Find the standing order to AS Pensionikeskus.', 'Change the amount and confirm.'],
    [
      'LHV',
      'Click the recipient AS Pensionikeskus and choose to edit it.',
      'Enter the new amount and confirm.',
    ],
    ['Luminor', 'Find the payment to AS Pensionikeskus.', 'Change the amount and confirm.'],
    [
      'Coop Pank',
      'Open the menu on the AS Pensionikeskus row and choose to edit it.',
      'Enter the new amount and confirm.',
    ],
  ])(
    'who pays from %s changes the amount in the payment they already have',
    async (bank, findPayment, changeAmount) => {
      openPage();

      userEvent.click(await screen.findByRole('radio', { name: bank }));

      expect(stepsTitled('Change the amount of your existing payment')).toEqual([
        { text: findPayment, remindsOfTaxRefund: false },
        { text: changeAmount, remindsOfTaxRefund: true },
      ]);
    },
  );

  test('who pays from another bank finds the payment to Pensionikeskus in their internet bank', async () => {
    openPage();

    userEvent.click(await screen.findByRole('radio', { name: 'Other bank' }));

    expect(stepsTitled('Change the amount of your existing payment')).toEqual([
      { text: 'Log in to your internet bank.', remindsOfTaxRefund: false },
      { text: 'Find the standing order to AS Pensionikeskus.', remindsOfTaxRefund: false },
      { text: 'Change the amount and confirm.', remindsOfTaxRefund: true },
    ]);
    expect(screen.queryByRole('link', { name: /^Open / })).not.toBeInTheDocument();
  });

  test.each([
    ['Swedbank', 'Open Swedbank', 'https://www.swedbank.ee/private/pensions/my/pensionAssets'],
    ['SEB', 'Open SEB', 'https://e.seb.ee/ib/p/payments/standing-orders'],
    ['LHV', 'Open LHV', 'https://www.lhv.ee/ibank/cf/portfolio/payment_standing'],
    ['Luminor', 'Open Luminor', 'https://luminor.ee/auth/#/web/view/autopilot/'],
    ['Coop Pank', /^Open Coop\sPank$/, 'https://i.cooppank.ee/i/standing-orders'],
    ['Wise', 'Open Wise', 'https://wise.com/payments/scheduled-transfers'],
  ])(
    'who pays from %s opens the bank in a new tab where the change is made',
    async (bank, openBank, bankPage) => {
      openPage();

      userEvent.click(await screen.findByRole('radio', { name: bank }));

      const link = screen.getByRole('link', { name: openBank });
      expect(link).toHaveAttribute('href', bankPage);
      expect(link).toHaveAttribute('target', '_blank');
    },
  );

  test('who pays from Wise cancels the scheduled transfer, then schedules a new one with the new amount', async () => {
    openPage();

    userEvent.click(await screen.findByRole('radio', { name: 'Wise' }));

    expect(stepsTitled('End your old payment, then set up a new one')).toEqual([
      {
        text: 'Select the scheduled transfer to AS Pensionikeskus, note its Reference and click Cancel transfer.',
        remindsOfTaxRefund: false,
      },
      {
        text: 'Then click Schedule a transfer, pick AS Pensionikeskus as the recipient, enter the new amount and the same reference, choose monthly and confirm with Schedule transfer.',
        remindsOfTaxRefund: true,
      },
    ]);
  });

  test('who pays from a bank with no guide of its own gets the steps for any other bank', async () => {
    openPage();

    userEvent.click(await screen.findByRole('radio', { name: 'Revolut' }));

    expect(stepsTitled('Change the amount of your existing payment')).toEqual([
      { text: 'Log in to your internet bank.', remindsOfTaxRefund: false },
      { text: 'Find the standing order to AS Pensionikeskus.', remindsOfTaxRefund: false },
      { text: 'Change the amount and confirm.', remindsOfTaxRefund: true },
    ]);
    expect(screen.queryByRole('link', { name: /^Open / })).not.toBeInTheDocument();
  });

  test('who opened the bank is asked on returning whether the payment was changed, and confirms it', async () => {
    openPage();
    userEvent.click(await screen.findByRole('radio', { name: 'SEB' }));

    userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));

    expect(
      screen.getByRole('heading', { name: 'Did you change your recurring payment?' }),
    ).toBeInTheDocument();
    expect(history.location.search).toBe('?bank=seb&confirm=1');

    userEvent.click(screen.getByRole('button', { name: 'Yes, done' }));

    expect(
      screen.getByRole('heading', { name: 'Your recurring payment is changed' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account');
  });

  test('who has not changed the payment yet gets the steps for the same bank back', async () => {
    openPage();
    userEvent.click(await screen.findByRole('radio', { name: 'LHV' }));
    userEvent.click(screen.getByRole('link', { name: 'Open LHV' }));

    userEvent.click(screen.getByRole('button', { name: 'Show the steps again' }));

    expect(await screen.findByRole('radio', { name: 'LHV' })).toBeChecked();
    expect(screen.getByRole('link', { name: 'Open LHV' })).toBeInTheDocument();
    expect(history.location.search).toBe('?bank=lhv');
  });

  test('who comes back to a reloaded page still gets the steps for the bank they opened', async () => {
    openPage('en', '?bank=lhv&confirm=1');

    userEvent.click(await screen.findByRole('button', { name: 'Show the steps again' }));

    expect(await screen.findByRole('radio', { name: 'LHV' })).toBeChecked();
    expect(screen.getByRole('link', { name: 'Open LHV' })).toBeInTheDocument();
    expect(history.location.search).toBe('?bank=lhv');
  });

  test('who opened the page in English stays in English when the page reloads after the bank', async () => {
    openPage('en', '?language=en');
    userEvent.click(await screen.findByRole('radio', { name: 'SEB' }));

    userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));
    expect(history.location.search).toBe('?language=en&bank=seb&confirm=1');

    userEvent.click(screen.getByRole('button', { name: 'Yes, done' }));
    expect(history.location.search).toBe('?language=en&bank=seb&changed=1');
  });

  test('who arrives with a bank the page does not know is asked to pick one', async () => {
    openPage('en', '?bank=unknown');

    expect(await screen.findByRole('radio', { name: 'Swedbank' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Other bank' })).not.toBeChecked();
    expect(screen.queryByRole('list', { name: /payment/ })).not.toBeInTheDocument();
  });

  test('who goes back after confirming the change gets the steps for the same bank', async () => {
    openPage();
    userEvent.click(await screen.findByRole('radio', { name: 'SEB' }));
    userEvent.click(screen.getByRole('link', { name: 'Open SEB' }));
    userEvent.click(screen.getByRole('button', { name: 'Yes, done' }));

    act(() => history.goBack());

    expect(await screen.findByRole('radio', { name: 'SEB' })).toBeChecked();
    expect(screen.getByRole('link', { name: 'Open SEB' })).toBeInTheDocument();
  });

  test('who cannot find the payment, pays through an employer or wants to see the gain finds where to go', async () => {
    openPage();

    expect(
      await screen.findByRole('link', { name: 'Can’t find your payment? Set up a new one' }),
    ).toHaveAttribute('href', '/3rd-pillar-payment?type=RECURRING');
    expect(screen.getByRole('link', { name: 'Paying through your employer?' })).toHaveAttribute(
      'href',
      '/3rd-pillar-employer',
    );
    const calculator = screen.getByRole('link', { name: 'Calculate your tax gain' });
    expect(calculator).toHaveAttribute('href', 'https://tuleva.ee/en/third-pillar/');
    expect(calculator).toHaveAttribute('target', '_blank');
  });

  test('counts which bank people pick and whether they open it', async () => {
    openPage();

    userEvent.click(await screen.findByRole('radio', { name: 'Swedbank' }));
    userEvent.click(screen.getByRole('link', { name: 'Open Swedbank' }));

    await waitFor(() =>
      expect(trackedEvents).toEqual([
        {
          type: 'CLICK',
          data: {
            bank: 'swedbank',
            path: '/3rd-pillar-recurring-payment',
            target: 'standing-order-bank',
          },
        },
        {
          type: 'CLICK',
          data: {
            bank: 'swedbank',
            path: '/3rd-pillar-recurring-payment',
            target: 'standing-order-open-bank',
          },
        },
      ]),
    );
  });
});

describe('a person reading in Estonian', () => {
  test('is told under the amount step how much income tax comes back', async () => {
    openPage('et');

    userEvent.click(await screen.findByRole('radio', { name: 'Swedbank' }));

    const [, enterAmount] = within(
      screen.getByRole('list', { name: 'Lõpeta vana püsimakse ja tee siis uus' }),
    ).getAllByRole('listitem');
    expect(
      within(enterAmount).getByText(
        'Saad igalt sissemakselt 22% tulumaksu tagasi kuni 15% ulatuses kalendriaasta brutotulust, kõige rohkem 6000 eurolt aastas.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avan Swedbanki' })).toBeInTheDocument();
  });
});
