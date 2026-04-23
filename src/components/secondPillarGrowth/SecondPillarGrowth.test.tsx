import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory } from 'history';
import SecondPillarGrowth from './SecondPillarGrowth';
import { SecondPillarAssets } from '../common/apiModels';
import { initializeConfiguration } from '../config/config';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { secondPillarAssetsBackend, userBackend, userConversionBackend } from '../../test/backend';
import { secondPillarAssetsResponse } from '../../test/backend-responses';

jest.mock('react-chartjs-2', () => ({
  Chart: () => <div data-testid="mock-chart" />,
}));

const server = setupServer();

const renderWithProviders = () => {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);
  return renderWrapped(<SecondPillarGrowth />, history as any, store);
};

const accountList = () => within(screen.getByTestId('account-list'));

const expectRow = async (label: string, amount: string) => {
  const list = within(await screen.findByTestId('account-list'));
  const definition = await list.findByRole('definition', { name: label });
  expect(definition).toHaveTextContent(amount);
};

const expectNoRow = (label: string) => {
  expect(accountList().queryByRole('term', { name: label })).not.toBeInTheDocument();
};

const querySubNote = () => screen.queryByTestId('sub-note');

const mockAssets = (overrides: Partial<SecondPillarAssets> = {}) =>
  secondPillarAssetsBackend(server, {
    pikFlag: false,
    balance: 0,
    employeeWithheldPortion: 0,
    socialTaxPortion: 0,
    additionalParentalBenefit: 0,
    interest: 0,
    compensation: 0,
    insurance: 0,
    corrections: 0,
    inheritance: 0,
    withdrawals: 0,
    transferredToPik: 0,
    ...overrides,
  });

describe('SecondPillarGrowth', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    userBackend(server);
    userConversionBackend(server);
  });

  it('shows a shimmer while data is loading', () => {
    server.use(
      rest.get('http://localhost/v1/second-pillar-assets', (req, res, ctx) =>
        res(ctx.delay(50), ctx.json(secondPillarAssetsResponse)),
      ),
    );
    renderWithProviders();
    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  describe('chart segments (Kaisa personas)', () => {
    it('case 1 — normal, positive growth, no withdrawals', async () => {
      mockAssets({
        balance: 15698.36,
        employeeWithheldPortion: 5531.39,
        socialTaxPortion: 8782.61,
      });
      renderWithProviders();
      await expectRow('Your contribution', '4 425 €');
      await expectRow('Tax win', '9 889 €');
      await expectRow('Return', '1 384 €');
      await expectRow('Total', '15 698 €');
      expectNoRow('Inheritance');
      expectNoRow('Withdrawn');
    });

    it('case 2 — negative growth, no withdrawals', async () => {
      mockAssets({
        balance: 14700.5,
        employeeWithheldPortion: 4903.95,
        socialTaxPortion: 9807.09,
      });
      renderWithProviders();
      await expectRow('Your contribution', '3 923 €');
      await expectRow('Tax win', '10 788 €');
      await expectRow('Return', '−11 €');
      await expectRow('Total', '14 701 €');
      expectNoRow('Withdrawn');
    });

    it('case 3 — fully withdrawn, balance 0', async () => {
      mockAssets({
        balance: 0,
        employeeWithheldPortion: 1696.38,
        socialTaxPortion: 2923.2,
        insurance: 310,
        withdrawals: 7160.25,
      });
      renderWithProviders();
      await expectRow('Your contribution', '1 357 €');
      await expectRow('Tax win', '3 262 €');
      await expectRow('Inheritance', '310 €');
      await expectRow('Return', '2 231 €');
      await expectRow('Withdrawn', '−7 160 €');
      await expectRow('Total', '0 €');
    });

    it('case 4 — small residual + negative growth + partial withdrawal', async () => {
      mockAssets({
        balance: 53,
        employeeWithheldPortion: 1096.38,
        socialTaxPortion: 2323.2,
        insurance: 350,
        withdrawals: 3500.25,
      });
      renderWithProviders();
      await expectRow('Your contribution', '877 €');
      await expectRow('Tax win', '2 542 €');
      await expectRow('Inheritance', '350 €');
      await expectRow('Return', '−216 €');
      await expectRow('Withdrawn', '−3 500 €');
      await expectRow('Total', '53 €');
    });

    it('case 5 — parental leave only (state pays on member behalf)', async () => {
      mockAssets({
        balance: 425.7,
        additionalParentalBenefit: 396.5,
      });
      renderWithProviders();
      await expectRow('Your contribution', '397 €');
      await expectRow('Return', '29 €');
      await expectRow('Total', '426 €');
      expectNoRow('Tax win');
    });

    it('case 6 — PIK conversion renders a disclaimer', async () => {
      mockAssets({
        pikFlag: true,
        balance: 0,
        employeeWithheldPortion: 2115.75,
        socialTaxPortion: 4737.2,
      });
      renderWithProviders();
      expect(await screen.findByTestId('pik-disclaimer')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('case 6b — PIK user with one outflow raises growth by the transferred amount', async () => {
      // User routed one month of contributions to PIK. Balance excludes PIK
      // but employeeWithheldPortion includes it, so naive growth would be
      // short by ~706.66. transferredToPik corrects the formula so the
      // growth matches the XIRR calculator on the account page.
      mockAssets({
        pikFlag: true,
        balance: 33465,
        employeeWithheldPortion: 5000,
        socialTaxPortion: 9853,
        transferredToPik: 706.66,
      });
      renderWithProviders();
      await expectRow('Transferred to PIK', '−707 €');
      await expectRow('Return', '19 319 €');
    });

    it('falls back to the pre-PIK formula when the backend omits transferredToPik', async () => {
      // Simulates running the frontend against an older backend (e.g. prod
      // before the /v1/second-pillar-assets enrichment is deployed). Without
      // a fallback, assets.transferredToPik would be undefined and growth
      // would be NaN, so the Return row would disappear entirely.
      mockAssets({
        balance: 15698.36,
        employeeWithheldPortion: 5531.39,
        socialTaxPortion: 8782.61,
        transferredToPik: undefined as unknown as number,
      });
      renderWithProviders();
      await expectRow('Return', '1 384 €');
      await expectRow('Total', '15 698 €');
    });

    it('does not render the PIK disclaimer for a non-PIK user', async () => {
      mockAssets();
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('pik-disclaimer')).not.toBeInTheDocument();
    });

    it('case 8 — inherited 2nd pillar assets render as a separate segment', async () => {
      mockAssets({
        balance: 28120.45,
        employeeWithheldPortion: 8042.15,
        socialTaxPortion: 13056.3,
        inheritance: 5000,
      });
      renderWithProviders();
      await expectRow('Your contribution', '6 434 €');
      await expectRow('Tax win', '14 665 €');
      await expectRow('Inheritance', '5 000 €');
      await expectRow('Return', '2 022 €');
      await expectRow('Total', '28 120 €');
    });

    it('case 7 — long-term saver with big positive growth', async () => {
      mockAssets({
        balance: 46048.71,
        employeeWithheldPortion: 9419.9,
        socialTaxPortion: 16453.08,
      });
      renderWithProviders();
      await expectRow('Your contribution', '7 536 €');
      await expectRow('Tax win', '18 337 €');
      await expectRow('Return', '20 176 €');
      await expectRow('Total', '46 049 €');
    });
  });

  describe('inheritance segment', () => {
    it('renders an inheritance segment when inheritance > 0', async () => {
      mockAssets({
        balance: 18000,
        employeeWithheldPortion: 5000,
        socialTaxPortion: 8000,
        inheritance: 3000,
      });
      renderWithProviders();
      await expectRow('Inheritance', '3 000 €');
      await expectRow('Return', '2 000 €');
    });

    it('omits the inheritance segment when inheritance is zero', async () => {
      mockAssets({ inheritance: 0 });
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expectNoRow('Inheritance');
    });
  });

  describe('sub-notes below chart', () => {
    it('does not add a withdrawals sub-note when growth is positive (the chart already shows it)', async () => {
      mockAssets({
        balance: 0,
        employeeWithheldPortion: 1696.38,
        socialTaxPortion: 2923.2,
        withdrawals: 7160.25,
      });
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expect(querySubNote()).not.toBeInTheDocument();
    });

    it('renders insurance receipts as inheritance rather than a special sub-note', async () => {
      mockAssets({
        balance: 12500,
        employeeWithheldPortion: 4000,
        socialTaxPortion: 6500,
        insurance: 2700,
        withdrawals: 3000,
      });
      renderWithProviders();
      await expectRow('Inheritance', '2 700 €');
      expect(querySubNote()).not.toBeInTheDocument();
    });

    it('shows the negative-return sub-note when return is negative and nothing has been withdrawn', async () => {
      mockAssets({
        balance: 14700.5,
        employeeWithheldPortion: 4903.95,
        socialTaxPortion: 9807.09,
      });
      renderWithProviders();
      expect(await screen.findByTestId('sub-note')).toHaveTextContent(
        /your II pillar is at a loss/i,
      );
    });

    it('shows the parental-leave sub-note when own contribution is zero and state contribution is positive', async () => {
      mockAssets({
        balance: 425.7,
        socialTaxPortion: 396.5,
      });
      renderWithProviders();
      expect(await screen.findByTestId('sub-note')).toHaveTextContent(
        /haven't made any contributions to your II pillar yet/i,
      );
    });

    it('shows no sub-note on the happy path', async () => {
      mockAssets({
        balance: 15698.36,
        employeeWithheldPortion: 5531.39,
        socialTaxPortion: 8782.61,
      });
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expect(querySubNote()).not.toBeInTheDocument();
    });

    it('shows only the PIK disclaimer (not a sub-note) when pikFlag is true', async () => {
      mockAssets({
        pikFlag: true,
        balance: 0,
        employeeWithheldPortion: 2115.75,
        socialTaxPortion: 4737.2,
      });
      renderWithProviders();
      expect(await screen.findByTestId('pik-disclaimer')).toBeInTheDocument();
      expect(querySubNote()).not.toBeInTheDocument();
    });
  });

  describe('account list', () => {
    it('lists the balance total', async () => {
      mockAssets({
        balance: 15698.36,
        employeeWithheldPortion: 5531.39,
        socialTaxPortion: 8782.61,
      });
      renderWithProviders();
      await expectRow('Total', '15 698 €');
    });

    it('lists own contribution, state, return and balance rows', async () => {
      mockAssets({
        balance: 15698.36,
        employeeWithheldPortion: 5531.39,
        socialTaxPortion: 8782.61,
      });
      renderWithProviders();
      await expectRow('Your contribution', '4 425 €');
      await expectRow('Tax win', '9 889 €');
      await expectRow('Return', '1 384 €');
      await expectRow('Total', '15 698 €');
    });

    it('includes an inheritance row only when inheritance > 0', async () => {
      mockAssets({
        balance: 18000,
        employeeWithheldPortion: 5000,
        socialTaxPortion: 8000,
        inheritance: 3000,
      });
      renderWithProviders();
      await expectRow('Inheritance', '3 000 €');
    });

    it('omits the inheritance row when inheritance is zero', async () => {
      mockAssets({ inheritance: 0 });
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expectNoRow('Inheritance');
    });

    it('includes a withdrawals row only when the user has withdrawn money', async () => {
      mockAssets({
        balance: 0,
        employeeWithheldPortion: 1696.38,
        socialTaxPortion: 2923.2,
        insurance: 310,
        withdrawals: 7160.25,
      });
      renderWithProviders();
      await expectRow('Withdrawn', '−7 160 €');
    });

    it('omits the withdrawals row when no money has been withdrawn', async () => {
      mockAssets({ withdrawals: 0 });
      renderWithProviders();
      expect(await screen.findByTestId('mock-chart')).toBeInTheDocument();
      expectNoRow('Withdrawn');
    });
  });

  describe('call-to-action', () => {
    it('marks the raise-rate item as pending for 2% contributors', async () => {
      server.resetHandlers();
      userBackend(server, { secondPillarPaymentRates: { current: 2, pending: null } });
      userConversionBackend(server);
      mockAssets();
      renderWithProviders();
      const raiseItem = await screen.findByTestId('cta-item-raiseRate');
      expect(raiseItem).toHaveAttribute('data-done', 'false');
    });

    it('keeps the raise-rate item pending for 4% contributors so they can still raise to 6%', async () => {
      server.resetHandlers();
      userBackend(server, { secondPillarPaymentRates: { current: 4, pending: null } });
      userConversionBackend(server);
      mockAssets();
      renderWithProviders();
      const raiseItem = await screen.findByTestId('cta-item-raiseRate');
      expect(raiseItem).toHaveAttribute('data-done', 'false');
    });

    it('keeps the raise-rate item pending when a pending filing lowers the rate below 6%', async () => {
      server.resetHandlers();
      userBackend(server, { secondPillarPaymentRates: { current: 6, pending: 4 } });
      userConversionBackend(server);
      mockAssets();
      renderWithProviders();
      const raiseItem = await screen.findByTestId('cta-item-raiseRate');
      expect(raiseItem).toHaveAttribute('data-done', 'false');
    });

    it('still renders the checklist when every item is done', async () => {
      server.resetHandlers();
      userBackend(server, {
        secondPillarActive: true,
        secondPillarPaymentRates: { current: 6, pending: null },
      });
      userConversionBackend(server, { weightedAverageFee: 0.003 });
      mockAssets();
      renderWithProviders();
      expect(await screen.findByTestId('cta-item-taxWin')).toHaveAttribute('data-done', 'true');
      expect(screen.getByTestId('cta-item-indexFund')).toHaveAttribute('data-done', 'true');
      expect(screen.getByTestId('cta-item-raiseRate')).toHaveAttribute('data-done', 'true');
      const link = await screen.findByRole('link', { name: /make a III\spillar contribution/i });
      expect(link).toHaveAttribute('href', '/3rd-pillar-payment');
    });
  });

  describe('methodology', () => {
    it('collapses the methodology section by default', async () => {
      mockAssets();
      renderWithProviders();
      const toggle = await screen.findByRole('button', { name: /how is this calculated/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('reveals the methodology content on click', async () => {
      mockAssets();
      renderWithProviders();
      const toggle = await screen.findByRole('button', { name: /how is this calculated/i });
      userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('explains the tax win breakdown (social tax + income tax savings)', async () => {
      mockAssets();
      renderWithProviders();
      expect(await screen.findByText(/4% funded from your social tax/i)).toBeInTheDocument();
      expect(await screen.findByText(/income-tax savings/i)).toBeInTheDocument();
    });
  });
});
