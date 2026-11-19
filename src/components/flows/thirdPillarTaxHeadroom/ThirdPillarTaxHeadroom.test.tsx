import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  expectedIncomeCorrectionBackend,
  taxDataConsentBackend,
  thirdPillarTaxHeadroomBackend,
  useTestBackends,
} from '../../../test/backend';
import { mockThirdPillarTaxHeadroom } from '../../../test/backend-responses';
import LoggedInApp from '../../LoggedInApp';

const server = setupServer();
let history: History;

const expectedMonths = (year: number, firstMonth: number, amounts: number[]) =>
  amounts.map((amount, index) => ({
    month: `${year}-${String(firstMonth + index).padStart(2, '0')}`,
    amount,
    source: 'ESTIMATED' as const,
  }));

const USED_UP_HEADROOM = {
  ...mockThirdPillarTaxHeadroom,
  paid: 4500,
  remaining: 0,
  refund: 0,
  monthlyPayment: 0,
};
const HIGH_EARNER_HEADROOM = {
  ...mockThirdPillarTaxHeadroom,
  knownIncome: 52000,
  expectedIncome: expectedMonths(2026, 11, [5200, 5200]),
  paid: 2000,
  limit: 6000,
  limitCertainty: 'CERTAIN' as const,
  remaining: 4000,
  refund: 880,
  monthlyPayment: 500,
};
const JANUARY_HEADROOM = {
  ...mockThirdPillarTaxHeadroom,
  year: 2027,
  knownIncome: 0,
  incomeKnownThrough: null,
  expectedIncome: expectedMonths(2027, 1, [...Array(11).fill(2300), 4700]),
  expectedIncomeBasis: 'LAST_YEAR' as const,
  paid: 0,
  monthsLeft: 12,
  remaining: 4500,
  refund: 990,
  paymentSuggestion: 'RECURRING' as const,
};
const NO_TAX_WIN_HEADROOM = {
  ...mockThirdPillarTaxHeadroom,
  knownIncome: 6000,
  expectedIncome: expectedMonths(2026, 11, [600, 600]),
  paid: 0,
  limit: 0,
  remaining: 0,
  refund: 0,
  monthlyPayment: 0,
};
const NO_DATA_HEADROOM = {
  ...NO_TAX_WIN_HEADROOM,
  knownIncome: 0,
  incomeKnownThrough: null,
  expectedIncome: expectedMonths(2026, 1, Array(12).fill(0)),
  expectedIncomeBasis: 'NO_DATA' as const,
};
const DECEMBER_BONUS_HEADROOM = {
  ...mockThirdPillarTaxHeadroom,
  expectedIncome: [
    { month: '2026-11', amount: 2500, source: 'ESTIMATED' as const },
    { month: '2026-12', amount: 12500, source: 'CORRECTED' as const },
  ],
  limit: 6000,
  remaining: 2740,
  refund: 602,
  monthlyPayment: 500,
};

function pdfOpensInNewTab() {
  const openedUrls: string[] = [];
  URL.createObjectURL = jest.fn(() => 'blob:tax-data-consent');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(window, 'open').mockImplementation((url) => {
    openedUrls.push(String(url));
    return {} as Window;
  });
  return () => openedUrls;
}

function openApp(path: string) {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  history.push(path);
}

const amountInput = async () =>
  (await screen.findByLabelText('What is the payment amount?')) as HTMLInputElement;

const recurringAmountInput = async () =>
  (await screen.findByLabelText('What is the recurring payment amount?')) as HTMLInputElement;

const ESTIMATE_TITLE = /^This year it is worth putting about this much more into your III\spillar$/;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  initializeConfiguration();
  useTestBackends(server);
});

describe('III pillar tax win headroom', () => {
  test('signs a consent for tax data and shows how much more can be put in with a tax win', async () => {
    const backend = taxDataConsentBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom');

    expect(
      await screen.findByRole('heading', {
        name: /^How much is it worth putting into your III\spillar this year\?$/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/valid for 12 months/)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Sign the consent' }));

    expect(await screen.findByText('9876')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: ESTIMATE_TITLE })).toBeInTheDocument();
    expect(backend.consentApproved()).toBe(true);
    expect(history.location.pathname).toBe('/3rd-pillar-tax-headroom/result');
    expect(screen.getByText(/^1240\s€$/)).toBeVisible();
    expect(screen.getByText(/of income tax back on it next year/)).toHaveTextContent(
      /^You get 272\s€ of income tax back on it next year\.$/,
    );
  });

  test('goes straight to the result when the person has already approved the consent elsewhere', async () => {
    taxDataConsentBackend(server, mockThirdPillarTaxHeadroom, 'APPROVED');

    openApp('/3rd-pillar-tax-headroom');

    userEvent.click(await screen.findByRole('button', { name: 'Sign the consent' }));

    expect(await screen.findByRole('heading', { name: ESTIMATE_TITLE })).toBeInTheDocument();
    expect(screen.queryByText('9876')).not.toBeInTheDocument();
  });

  test('shows the consent document before it is signed', async () => {
    taxDataConsentBackend(server, mockThirdPillarTaxHeadroom);
    const openedUrls = pdfOpensInNewTab();

    openApp('/3rd-pillar-tax-headroom');

    userEvent.click(await screen.findByRole('button', { name: 'View the consent' }));

    await waitFor(() => expect(openedUrls()).toEqual(['blob:tax-data-consent']));
  });

  test('says when the tax data cannot be fetched after signing', async () => {
    const backend = taxDataConsentBackend(server, mockThirdPillarTaxHeadroom);
    server.use(
      rest.get('http://localhost/v1/third-pillar/tax-headroom', (req, res, ctx) =>
        res(ctx.status(backend.consentApproved() ? 503 : 204)),
      ),
    );

    openApp('/3rd-pillar-tax-headroom');

    userEvent.click(await screen.findByRole('button', { name: 'Sign the consent' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /^We could not get your data from the Tax and Customs Board right now\. Please try again later\.$/,
    );
  });

  test('shows how the remaining amount was calculated', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom/result');

    userEvent.click(await screen.findByText('How we calculated this'));

    const breakdown = screen.getByRole('table');
    expect(
      within(breakdown).getByRole('row', { name: /Income January–October .*25\s000\s€/ }),
    ).toBeInTheDocument();
    expect(within(breakdown).getByLabelText('Expected income November')).toHaveValue('2500');
    expect(within(breakdown).getByLabelText('Expected income December')).toHaveValue('2500');
    expect(
      within(breakdown).getByRole('row', {
        name: /Tax win limit .* ~\s?4\s500\s€/,
      }),
    ).toBeInTheDocument();
    expect(
      within(breakdown).getByRole('row', { name: /Paid into III\spillar this year −3\s260\s€/ }),
    ).toBeInTheDocument();
    expect(
      within(breakdown).getByRole('row', { name: /You can still put in 1\s240\s€/ }),
    ).toBeInTheDocument();
  });

  test('marks the limit as an estimate while part of the year is still a guess', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(await screen.findByText(/Your limit/)).toHaveTextContent(/^Your limit ~4500\s€$/);
  });

  test('says which months the calculation guesses', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(await screen.findByText(/For the remaining months/)).toHaveTextContent(
      /^For the remaining months we assumed 2500\s€ a month\./,
    );
  });

  test('shows the limit as exact once declared income alone reaches the 6000 € cap', async () => {
    thirdPillarTaxHeadroomBackend(server, HIGH_EARNER_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(
      await screen.findByRole('heading', {
        name: /^This year it is worth putting this much more into your III\spillar$/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your limit/)).toHaveTextContent(/^Your limit 6000\s€$/);
    expect(screen.getByText(/^4000\s€$/)).toBeVisible();
    expect(screen.queryByText(/For the remaining months/)).not.toBeInTheDocument();
  });

  test('saves the income the person expects for a month, like a December bonus, and shows the new amount', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);
    const corrections = expectedIncomeCorrectionBackend(server, DECEMBER_BONUS_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    userEvent.click(await screen.findByRole('button', { name: 'Change' }));
    const december = screen.getByLabelText('Expected income December');
    userEvent.clear(december);
    userEvent.type(december, '12500');

    expect(await screen.findByText(/^2740\s€$/)).toBeVisible();
    expect(corrections()).toEqual([{ month: '2026-12', amount: 12500 }]);
    expect(screen.getByText(/Your limit/)).toHaveTextContent(/^Your limit ~6000\s€$/);

    userEvent.click(screen.getByRole('link', { name: 'Make a payment' }));

    expect((await amountInput()).value).toBe('2740');
  });

  test('says when the expected income for a month cannot be saved', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);
    server.use(
      rest.put(
        'http://localhost/v1/third-pillar/tax-headroom/expected-income/:month',
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    openApp('/3rd-pillar-tax-headroom/result');

    userEvent.click(await screen.findByRole('button', { name: 'Change' }));
    userEvent.type(screen.getByLabelText('Expected income December'), '0');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /^We could not save the change\. Please try again\.$/,
    );
    expect(screen.getByText(/^1240\s€$/)).toBeVisible();
  });

  test('estimates the year from the income of last year in January and suggests a monthly payment', async () => {
    thirdPillarTaxHeadroomBackend(server, JANUARY_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(
      await screen.findByRole('heading', {
        name: /^If you earn as much as last year, it is worth putting about this much into your III\spillar this year$/,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^4500\s€$/)[0]).toBeVisible();
    expect(screen.getByText(/We assumed/)).toHaveTextContent(
      /^We assumed last year's income: an average of 2500\s€ a month\./,
    );
    expect(screen.getByLabelText('Expected income December')).toHaveValue('4700');

    userEvent.click(
      screen.getByRole('link', { name: /^Set up a recurring payment of 375\s€ a month$/ }),
    );

    expect(history.location.pathname).toBe('/3rd-pillar-payment');
    expect((await recurringAmountInput()).value).toBe('375');
  });

  test('says there is no tax win when the income is below the tax-free amount', async () => {
    thirdPillarTaxHeadroomBackend(server, NO_TAX_WIN_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(
      await screen.findByRole('heading', {
        name: /^Your income this year gives no III\spillar tax win$/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Make a payment' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Your limit/)).not.toBeInTheDocument();
  });

  test('asks for the expected income when no income was found for this year or last year', async () => {
    thirdPillarTaxHeadroomBackend(server, NO_DATA_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(
      await screen.findByRole('heading', {
        name: /^We found no income for you this year or last year$/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Expected income December')).toBeVisible();
    expect(screen.queryByText(/We assumed/)).not.toBeInTheDocument();
  });

  test('opens the payment with the remaining amount filled in', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom/result');

    userEvent.click(await screen.findByRole('link', { name: 'Make a payment' }));

    expect(history.location.pathname).toBe('/3rd-pillar-payment');
    expect((await amountInput()).value).toBe('1240');
  });

  test('goes straight to the result when the tax data is already there', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-tax-headroom');

    expect(await screen.findByRole('heading', { name: ESTIMATE_TITLE })).toBeInTheDocument();
    expect(history.location.pathname).toBe('/3rd-pillar-tax-headroom/result');
  });

  test('says the tax win is used up when nothing remains', async () => {
    thirdPillarTaxHeadroomBackend(server, USED_UP_HEADROOM);

    openApp('/3rd-pillar-tax-headroom/result');

    expect(
      await screen.findByRole('heading', {
        name: /^You have used up this year's III\spillar tax win$/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Make a payment' })).not.toBeInTheDocument();
  });
});

describe('III pillar payment with a known tax win headroom', () => {
  test('links to the headroom calculation while the tax data is unknown', async () => {
    openApp('/3rd-pillar-payment');

    expect(
      await screen.findByRole('link', {
        name: /^How much is it worth putting into my III\spillar this year\?$/,
      }),
    ).toHaveAttribute('href', '/3rd-pillar-tax-headroom');
  });

  test('shows the remaining amount and warns about the part above it', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-payment');

    expect(await screen.findByText(/in with a tax win\./)).toHaveTextContent(
      /^This year you can still put about 1240\s€ in with a tax win\./,
    );

    const input = await amountInput();
    userEvent.clear(input);
    userEvent.type(input, '1500');

    expect(screen.getByText(/of this amount gets no tax win/)).toHaveTextContent(
      /^260\s€ of this amount gets no tax win\./,
    );
    expect(screen.queryByText(/6000/)).not.toBeInTheDocument();
  });

  test('fills in the remaining amount', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/3rd-pillar-payment');

    userEvent.click(await screen.findByRole('button', { name: /^Use 1240\s€$/ }));

    expect((await amountInput()).value).toBe('1240');
  });
});

describe('account page with a known tax win headroom', () => {
  test('shows the remaining amount in the III pillar status', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/account');

    expect(await screen.findByText(/with a tax win/)).toHaveTextContent(
      /^This year you can still put about 1240\s€ in with a tax win$/,
    );
  });

  test('keeps the III pillar payments in the status until the person enters their expected income', async () => {
    thirdPillarTaxHeadroomBackend(server, NO_DATA_HEADROOM);

    openApp('/account');

    expect(
      await screen.findByRole('link', {
        name: /^How much is it worth putting into my III\spillar this year\?$/,
      }),
    ).toHaveAttribute('href', '/3rd-pillar-tax-headroom');
    expect(screen.queryByText(/with a tax win/)).not.toBeInTheDocument();
  });

  test('keeps the link to the calculation under the III pillar funds once the tax data is known', async () => {
    thirdPillarTaxHeadroomBackend(server, mockThirdPillarTaxHeadroom);

    openApp('/account');

    expect(
      await screen.findByRole('link', {
        name: /^How much is it worth putting into my III\spillar this year\?$/,
      }),
    ).toHaveAttribute('href', '/3rd-pillar-tax-headroom');
  });

  test('links to the headroom calculation under the III pillar funds while the tax data is unknown', async () => {
    openApp('/account');

    expect(
      await screen.findByRole('link', {
        name: /^How much is it worth putting into my III\spillar this year\?$/,
      }),
    ).toHaveAttribute('href', '/3rd-pillar-tax-headroom');
  });
});
