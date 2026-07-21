import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import translations from '../translations';
import { PensionCalculator } from './PensionCalculator';
import {
  useContributions,
  useConversion,
  useFunds,
  useMe,
  useSavingsFundBalance,
  useSourceFunds,
  useTransactions,
} from '../common/apiHooks';
import {
  Contribution,
  Fund,
  SourceFund,
  Transaction,
  User,
  UserConversion,
} from '../common/apiModels';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useSourceFunds: jest.fn(),
  useContributions: jest.fn(),
  useConversion: jest.fn(),
  useFunds: jest.fn(),
  useSavingsFundBalance: jest.fn(),
  useTransactions: jest.fn(),
}));

// The chart is Chart.js on a canvas, which jsdom cannot draw. Swap it for a stub
// that surfaces the numbers as text so the projection stays assertable.
jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: { labels: number[]; datasets: { data: number[] }[] } }) => (
    <div>
      <span data-testid="chart-first-age">{data.labels[0]}</span>
      <span data-testid="chart-last-age">{data.labels[data.labels.length - 1]}</span>
      <span data-testid="chart-peak">
        {Math.round(
          Math.max(
            ...data.labels.map((_, index) =>
              data.datasets.reduce((sum, dataset) => sum + dataset.data[index], 0),
            ),
          ),
        )}
      </span>
      {/* The raw series, so a test can pin a specific bucket at a specific age. */}
      <span data-testid="chart-data">
        {JSON.stringify({
          labels: data.labels,
          second: data.datasets[0].data,
          third: data.datasets[1].data,
          savings: data.datasets[2].data,
        })}
      </span>
    </div>
  ),
}));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockUseSourceFunds = useSourceFunds as jest.MockedFunction<typeof useSourceFunds>;
const mockUseContributions = useContributions as jest.MockedFunction<typeof useContributions>;
const mockUseConversion = useConversion as jest.MockedFunction<typeof useConversion>;
const mockUseFunds = useFunds as jest.MockedFunction<typeof useFunds>;
const mockUseSavingsFundBalance = useSavingsFundBalance as jest.MockedFunction<
  typeof useSavingsFundBalance
>;
const mockUseTransactions = useTransactions as jest.MockedFunction<typeof useTransactions>;

const now = new Date('2026-07-15T12:00:00Z');

const monthsAgo = (months: number): string => {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
};

// Every prefilled value is deliberately DIFFERENT from the component's fallback
// (retirement 65, salary 2000, rate 2), so these tests fail if seeding from the
// API data silently stops and the fallbacks take over.
const user = (overrides: Partial<User> = {}): User =>
  ({
    age: 35,
    dateOfBirth: '1991-04-11T00:00:00Z',
    retirementAge: 66,
    secondPillarActive: true,
    secondPillarPaymentRates: { current: 4, pending: null },
    ...overrides,
  } as User);

const sourceFunds: SourceFund[] = [
  { pillar: 2, price: 14200, unavailablePrice: 0 } as SourceFund,
  { pillar: 3, price: 3800, unavailablePrice: 0 } as SourceFund,
];

// 4% of gross is the state's social-tax top-up, so 120 € means a 3000 € gross salary.
const salaryContribution = (time: string): Contribution => ({
  pillar: 2,
  socialTaxPortion: 120,
  employeeWithheldPortion: 60,
  additionalParentalBenefit: 0,
  interest: 0,
  time,
  amount: 180,
  sender: 'Employer',
  currency: 'EUR',
});

const contributions: Contribution[] = [
  // The earliest row anchors where the chart begins: September 2016, at age 25.
  salaryContribution('2016-09-10T00:00:00Z'),
  ...Array.from({ length: 12 }, (_, index) => salaryContribution(monthsAgo(index))),
];

const thirdPillarStandingOrder = (amount: number): Contribution[] =>
  Array.from({ length: 4 }, (_, index) => ({
    pillar: 3,
    amount,
    time: monthsAgo(index),
    sender: 'Self',
    currency: 'EUR',
  }));

const conversion: UserConversion = {
  weightedAverageFee: 0.011,
} as UserConversion;

// The savings fund is the fund with no pillar; that is how its transactions are known.
const SAVINGS_FUND_ISIN = 'EE0000003283';
const funds: Fund[] = [
  {
    isin: 'EE3600109435',
    pillar: 2,
    status: 'ACTIVE',
    ongoingChargesFigure: 0.0028,
    fundManager: { name: 'Tuleva' },
  } as Fund,
  // A pricier fund from another manager sets the fee slider's upper bound.
  {
    isin: 'EE3600019758',
    pillar: 2,
    status: 'ACTIVE',
    ongoingChargesFigure: 0.0157,
    fundManager: { name: 'Swedbank' },
  } as Fund,
  {
    isin: SAVINGS_FUND_ISIN,
    pillar: null,
    status: 'ACTIVE',
    // Deliberately different from the pension funds' 0.28%, so a test can tell
    // which of the two fees ends up where.
    ongoingChargesFigure: 0.0049,
    fundManager: { name: 'Tuleva' },
  } as Fund,
];

const savingsFundHolding = {
  price: 20000,
  unavailablePrice: 0,
  units: 1000,
  contributions: 20000,
  subtractions: 0,
} as SourceFund;
const savingsFundPayment = (
  amount: number,
  months: number,
  type = 'CONTRIBUTION_CASH',
): Transaction =>
  ({
    isin: SAVINGS_FUND_ISIN,
    amount,
    time: monthsAgo(months),
    type,
  } as Transaction);

const givenSavingsFund = (
  payments: Transaction[] = [],
  holding: SourceFund = savingsFundHolding,
) => {
  mockUseSavingsFundBalance.mockReturnValue({ data: holding } as ReturnType<
    typeof useSavingsFundBalance
  >);
  mockUseTransactions.mockReturnValue({ data: payments } as unknown as ReturnType<
    typeof useTransactions
  >);
};

const renderCalculator = (initialPath = '/calculator') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <IntlProvider locale="en" messages={translations.en}>
        <PensionCalculator />
      </IntlProvider>
    </MemoryRouter>,
  );

const peak = () => Number(screen.getByTestId('chart-peak').textContent);

const euroValue = (testId: string) =>
  Number((screen.getByTestId(testId).textContent ?? '').replace(/\D/g, ''));

const setSlider = (name: RegExp, value: number) =>
  // eslint-disable-next-line testing-library/prefer-user-event
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } });

describe('PensionCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockUseMe.mockReturnValue({ data: user() } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({ data: contributions } as ReturnType<
      typeof useContributions
    >);
    mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);
    mockUseFunds.mockReturnValue({ data: funds } as unknown as ReturnType<typeof useFunds>);
    mockUseSavingsFundBalance.mockReturnValue({ data: null } as ReturnType<
      typeof useSavingsFundBalance
    >);
    mockUseTransactions.mockReturnValue({ data: [] } as unknown as ReturnType<
      typeof useTransactions
    >);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows a loading state until the saver data has arrived', () => {
    mockUseMe.mockReturnValue({ data: undefined } as ReturnType<typeof useMe>);

    renderCalculator();

    expect(screen.queryByTestId('headline')).not.toBeInTheDocument();
  });

  it('still opens when the savings fund balance request fails', () => {
    mockUseSavingsFundBalance.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    expect(screen.getByTestId('headline')).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /Savings fund monthly/i })).not.toBeInTheDocument();
  });

  it('shows a headline with a pot and a monthly payment, at the projected pension age', () => {
    renderCalculator();
    // Born 1991, so the life-expectancy link projects ~69 — above the register's 66.
    expect(screen.getByTestId('headline')).toHaveTextContent(/At 69 you will have around/);
    expect(euroValue('first-payment')).toBeGreaterThan(0);
  });

  it('charts the whole saving life, from the first contribution through the payout period', () => {
    renderCalculator();
    // First II pillar contribution in September 2016, when a 35-year-old was 25;
    // retires at the projected 69 and draws down over the projected 20 years.
    expect(screen.getByTestId('chart-first-age')).toHaveTextContent('25');
    expect(screen.getByTestId('chart-last-age')).toHaveTextContent('89');
  });

  it('defaults the payout period to the life expectancy projected for the retirement year', () => {
    renderCalculator();
    // 19.3 years at 65 today, plus ~1.2 years per decade over the 34 years to go,
    // minus ~0.75 per year for starting at 69 instead of 65 — the same number the
    // tax-free bar uses, so the default payout sits exactly on it.
    expect(screen.getByRole('slider', { name: /Payouts last/i })).toHaveValue('20');
  });

  it("draws the past scaled to today's balances, bucket by bucket", () => {
    renderCalculator();
    const chart = JSON.parse(screen.getByTestId('chart-data').textContent ?? '{}');

    // A year ago (age 34) only the 2016 contribution had landed: 120 € of the
    // 1560 € total paid in, scaled so the full history ends on today's 14 200 €.
    const yearAgo = chart.labels.indexOf(34);
    expect(chart.second[yearAgo]).toBeCloseTo(120 * (14200 / 1560), 6);
    // The III pillar has a balance but no contribution rows, so it draws no past.
    expect(chart.third[yearAgo]).toBe(0);

    // Today's point carries the real balances, bucket by bucket.
    const today = chart.labels.indexOf(35);
    expect(chart.second[today]).toBe(14200);
    expect(chart.third[today]).toBe(3800);
    expect(chart.savings[today]).toBe(0);
  });

  it('draws a savings fund withdrawal as a dip in the past', () => {
    givenSavingsFund([savingsFundPayment(10000, 30), savingsFundPayment(-5000, 6, 'SUBTRACTION')], {
      ...savingsFundHolding,
      price: 6000,
      contributions: 10000,
      subtractions: -5000,
    } as SourceFund);

    renderCalculator();
    const chart = JSON.parse(screen.getByTestId('chart-data').textContent ?? '{}');

    // 5000 € net paid in has grown to 6000 €, so the pre-withdrawal 10 000 € deposit
    // draws above today's balance and the redemption reads as a real dip.
    expect(chart.savings[chart.labels.indexOf(34)]).toBeCloseTo(10000 * (6000 / 5000), 6);
    expect(chart.savings[chart.labels.indexOf(35)]).toBe(6000);
  });

  it('switches to yearly renewal: no period slider, an inheritance instead of zero', () => {
    renderCalculator();

    userEvent.click(screen.getByLabelText(/biggest possible inheritance/i));

    // The period is no longer the saver's to pick: disabled, showing the real
    // horizon (100 - 69 = 31 years).
    const payoutSlider = screen.getByRole('slider', { name: /Payouts last/i });
    expect(payoutSlider).toBeDisabled();
    expect(payoutSlider).toHaveValue('31');
    // What remains at 100 is the strategy's point; the classic contract shows 0.
    expect(euroValue('inheritance')).toBeGreaterThan(0);
    // The horizon's last payment misrepresents a renewal strategy; the average
    // payment takes its place.
    expect(screen.getByTestId('average-payment')).toBeInTheDocument();
    expect(screen.queryByTestId('last-payment')).not.toBeInTheDocument();
    // The card's tax-free note stays put, so toggling never shifts the layout.
    expect(screen.getByTestId('tax-free-note')).toBeInTheDocument();
    // The projection now runs to the age-100 horizon instead of a chosen end.
    expect(screen.getByTestId('chart-last-age')).toHaveTextContent('100');

    // Switching the strategy off restores the classic fixed-period contract.
    userEvent.click(screen.getByLabelText(/biggest possible inheritance/i));
    expect(screen.getByRole('slider', { name: /Payouts last/i })).toBeInTheDocument();
  });

  it('switches to the maximum pension strategy, and the two strategies exclude each other', () => {
    renderCalculator();

    userEvent.click(screen.getByLabelText(/biggest possible inheritance/i));
    userEvent.click(screen.getByLabelText(/biggest pension that lasts/i));

    expect(screen.getByLabelText(/biggest pension that lasts/i)).toBeChecked();
    expect(screen.getByLabelText(/biggest possible inheritance/i)).not.toBeChecked();

    // Switching the strategy off restores the classic fixed-period contract.
    userEvent.click(screen.getByLabelText(/biggest pension that lasts/i));
    expect(screen.getByRole('slider', { name: /Payouts last/i })).toBeEnabled();
  });

  it('has no age or balance inputs: they come from the register', () => {
    renderCalculator();
    expect(screen.queryByLabelText(/Your age/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pillar balance|fund balance/i)).not.toBeInTheDocument();
  });

  it('lets the saver pick their own retirement age, starting from the projected one', () => {
    renderCalculator();
    const retirementSlider = screen.getByRole('slider', {
      name: /You start withdrawing/i,
    });
    expect(retirementSlider).toHaveValue('69');
    // Paindlik pension: five years either side of the register's statutory 66.
    expect(retirementSlider).toHaveAttribute('min', '61');
    expect(retirementSlider).toHaveAttribute('max', '71');

    setSlider(/You start withdrawing/i, 71);

    expect(screen.getByTestId('headline')).toHaveTextContent(/At 71 you will have around/);
  });

  it('starts from the register age when the saver is already close to retirement', () => {
    mockUseMe.mockReturnValue({
      data: user({ age: 63, dateOfBirth: '1963-05-02T00:00:00Z', retirementAge: 65 }),
    } as ReturnType<typeof useMe>);

    renderCalculator();

    expect(screen.getByRole('slider', { name: /You start withdrawing/i })).toHaveValue('65');
  });

  it('pre-fills the salary from the II pillar contributions', () => {
    renderCalculator();
    // Median social-tax portion 120 € a month is 4% of a 3000 € gross.
    expect(screen.getByLabelText(/Gross monthly salary/i)).toHaveValue('3000');
  });

  it('pre-fills the II pillar rate from the register', () => {
    renderCalculator();
    expect(screen.getByRole('button', { name: '4%' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '2%' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('prefers a pending II pillar rate change over the current rate', () => {
    mockUseMe.mockReturnValue({
      data: user({ secondPillarPaymentRates: { current: 4, pending: 6 } }),
    } as ReturnType<typeof useMe>);

    renderCalculator();

    expect(screen.getByRole('button', { name: '6%' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pre-fills the III pillar slider from a standing order', () => {
    mockUseContributions.mockReturnValue({
      data: [...contributions, ...thirdPillarStandingOrder(100)],
    } as ReturnType<typeof useContributions>);

    renderCalculator();

    // 4 months × 100 € in the trailing year averages to 33 €, rounded to the 10 € step.
    expect(screen.getByRole('slider', { name: /III.pillar monthly/i })).toHaveValue('30');
  });

  it('opens on a 0% return with the saver’s own average fee', () => {
    renderCalculator();
    expect(screen.getByTestId('return-warning')).toHaveTextContent(
      'Calculated at a 0% annual return.',
    );
    // The saver's own weighted-average fee lands on the fee slider readout.
    expect(screen.getByText('−1.10%')).toBeInTheDocument();
    expect(screen.getByTestId('risk-warning')).toHaveTextContent(
      /Returns are not guaranteed\. The value of an investment can rise and fall\./,
    );
  });

  it('hides the savings fund slider from savers who do not hold the fund', () => {
    renderCalculator();
    expect(screen.queryByRole('slider', { name: /Savings fund monthly/i })).not.toBeInTheDocument();
  });

  it('shows the savings fund slider to unit holders, pre-filled from their standing order', () => {
    givenSavingsFund([
      savingsFundPayment(150, 0),
      savingsFundPayment(150, 1),
      savingsFundPayment(150, 2),
    ]);

    renderCalculator();

    expect(screen.getByRole('slider', { name: /Savings fund monthly/i })).toHaveValue('150');
  });

  it('grows the pot when the saver raises their II pillar rate', () => {
    renderCalculator();
    const before = peak();
    userEvent.click(screen.getByRole('button', { name: '6%' }));
    expect(peak()).toBeGreaterThan(before);
  });

  it('drops contributions to nothing when the saver toggles their rate off', () => {
    renderCalculator();
    const before = peak();
    // The rate buttons toggle: clicking the active one means "I left the II pillar".
    userEvent.click(screen.getByRole('button', { name: '4%' }));
    expect(peak()).toBeLessThan(before);
  });

  it('says the payments are tax free over the recommended period', () => {
    renderCalculator();
    expect(screen.getByTestId('tax-free-note')).toHaveTextContent(/free of income tax/);
    expect(screen.queryByTestId('tax-warning')).not.toBeInTheDocument();
    // A fixed-period contract pays the whole pot out: nothing left to inherit.
    expect(euroValue('inheritance')).toBe(0);
  });

  it('raises the tax-free bar when money starts moving earlier', () => {
    renderCalculator();
    // At the default 69 the remaining lifetime is ~16 years; starting at 61 it is
    // ~22, so a 19-year payout that would be tax free at 69 gets the warning.
    setSlider(/You start withdrawing/i, 61);
    setSlider(/Payouts last/i, 19);

    expect(screen.getByTestId('tax-warning')).toBeInTheDocument();
  });

  it('projects no savings fund contributions for a saver who no longer holds units', () => {
    // A standing order in the past, but the account is empty today: the slider is
    // hidden, so nothing may be silently projected behind it.
    mockUseTransactions.mockReturnValue({
      data: [savingsFundPayment(150, 0), savingsFundPayment(150, 1), savingsFundPayment(150, 2)],
    } as unknown as ReturnType<typeof useTransactions>);

    renderCalculator();

    const chart = JSON.parse(screen.getByTestId('chart-data').textContent ?? '{}');
    expect(Math.max(...chart.savings)).toBe(0);
  });

  it('warns about 10% tax as soon as the payout period goes below the recommended one', () => {
    renderCalculator();
    setSlider(/Payouts last/i, 10);

    expect(screen.getByTestId('tax-warning')).toHaveTextContent(/taxed at 10%/);
    expect(screen.queryByTestId('tax-free-note')).not.toBeInTheDocument();
  });

  it('shrinks the monthly payment when the payout period is stretched', () => {
    renderCalculator();
    const before = euroValue('first-payment');

    setSlider(/Payouts last/i, 30);

    expect(euroValue('first-payment')).toBeLessThan(before);
    expect(screen.getByTestId('chart-last-age')).toHaveTextContent('99');
  });

  it('blames the payout period only for the tax the payout period causes', () => {
    // Savings-fund money owes 22% on its gains whatever period is chosen, so it
    // must not be counted into the warning about picking a short period.
    mockUseMe.mockReturnValue({ data: user({ secondPillarActive: false }) } as ReturnType<
      typeof useMe
    >);
    mockUseSourceFunds.mockReturnValue({ data: [] } as unknown as ReturnType<
      typeof useSourceFunds
    >);
    mockUseContributions.mockReturnValue({ data: [] } as unknown as ReturnType<
      typeof useContributions
    >);
    givenSavingsFund();

    renderCalculator();
    setSlider(/Savings fund monthly/i, 500);
    setSlider(/Payouts last/i, 10);

    // Nothing in the II or III pillar, so a short period costs nothing — even
    // though the savings fund still owes 22% on its gains.
    expect(screen.getByTestId('tax-warning')).toHaveTextContent(/around 0 €/);
    expect(euroValue('first-payment')).toBeGreaterThan(0);
  });

  it("restates the pot in today's money by default and in nominal euros when switched off", () => {
    renderCalculator();
    // A positive return, so inflation has something to deflate.
    setSlider(/Annual return/i, 5);
    const real = peak();
    userEvent.click(screen.getByLabelText("in today's money"));
    expect(peak()).toBeGreaterThan(real);
  });

  it('names the provider and points at the prospectus', () => {
    renderCalculator();
    expect(screen.getByTestId('disclaimer')).toHaveTextContent(
      /The financial service is provided by Tuleva Fondid AS/,
    );
    expect(screen.getByTestId('disclaimer')).toHaveTextContent(/prospectus/);
    expect(screen.getByTestId('disclaimer')).toHaveTextContent(/Tax laws change over time/);
  });

  it('recomputes the projection when the return assumption moves', () => {
    renderCalculator();
    const before = peak();

    setSlider(/Annual return/i, 8);

    expect(peak()).toBeGreaterThan(before);
    expect(screen.getByTestId('return-warning')).toHaveTextContent(/8% annual return/);
  });

  it('shrinks the projection when the saver picks a pricier fund', () => {
    renderCalculator();
    const before = peak();

    setSlider(/Annual fees/i, 1.5);

    expect(peak()).toBeLessThan(before);
  });

  it('bounds the fee slider by the cheapest and priciest live pension fund', () => {
    renderCalculator();
    const feeSlider = screen.getByRole('slider', { name: /Annual fees/i });
    expect(feeSlider).toHaveAttribute('min', '0.28');
    expect(feeSlider).toHaveAttribute('max', '1.57');
  });

  it('caps the III pillar slider at 15% of gross salary', () => {
    renderCalculator();
    // 15% of the 3000 € prefilled gross is 450 €, below the 500 € absolute ceiling.
    expect(screen.getByRole('slider', { name: /III.pillar monthly/i })).toHaveAttribute(
      'max',
      '450',
    );
  });

  it('reads a shared return from the url, clamped into the slider range', () => {
    renderCalculator('/calculator?return=7');
    expect(screen.getByTestId('return-warning')).toHaveTextContent(/7% annual return/);
    // A return arrived with the link, so the 0% nudge has nothing left to do.
    expect(
      screen.queryByRole('button', { name: /Use the historical stock return of 7%/i }),
    ).not.toBeInTheDocument();

    cleanup();
    renderCalculator('/calculator?return=999');
    expect(screen.getByTestId('return-warning')).toHaveTextContent(/10% annual return/);

    cleanup();
    renderCalculator('/calculator?return=abc');
    expect(screen.getByTestId('return-warning')).toHaveTextContent(/0% annual return/);
  });

  it('offers the historical-return link only on the untouched 0% default', () => {
    renderCalculator();

    userEvent.click(screen.getByRole('button', { name: /Use the historical stock return of 7%/i }));

    expect(screen.getByTestId('return-warning')).toHaveTextContent(/7% annual return/);
    expect(
      screen.queryByRole('button', { name: /Use the historical stock return of 7%/i }),
    ).not.toBeInTheDocument();

    // A saver who picked any return of their own is done choosing: no more nudge.
    setSlider(/Annual return/i, 3);
    expect(
      screen.queryByRole('button', { name: /Use the historical stock return of 7%/i }),
    ).not.toBeInTheDocument();
  });

  it('sets the historical return from the hint link', () => {
    renderCalculator();

    userEvent.click(screen.getByRole('button', { name: /return 7%/i }));

    expect(screen.getByTestId('return-warning')).toHaveTextContent(/7% annual return/);
  });

  it('taxes the gains already sitting in the savings fund, using the paid-in basis', () => {
    // Same 20 000 € holding twice: first fully paid in, then half of it gains.
    givenSavingsFund();
    const { unmount } = renderCalculator();
    const fullBasisLastPayment = euroValue('last-payment');
    unmount();

    givenSavingsFund([], { ...savingsFundHolding, contributions: 10000 } as SourceFund);
    renderCalculator();

    // The gains half is taxed on the way out, so the late payments come out smaller.
    expect(euroValue('last-payment')).toBeLessThan(fullBasisLastPayment);
  });

  it('lets the saver type a savings fund amount past the slider cap, clamped to four digits', () => {
    givenSavingsFund();
    renderCalculator();

    const amount = screen.getByRole('textbox', { name: /Savings fund monthly/i });
    amount.textContent = '250';
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.input(amount);
    expect(amount).toHaveTextContent(/^250$/);
    expect(screen.getByRole('slider', { name: /Savings fund monthly/i })).toHaveValue('250');

    amount.textContent = '12345';
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.input(amount);
    // The display itself snaps back to the cap, not just the value behind it.
    expect(amount).toHaveTextContent(/^9999$/);
  });

  it('counts savings fund money towards the monthly payment', () => {
    givenSavingsFund();

    renderCalculator();
    const before = euroValue('first-payment');

    setSlider(/Savings fund monthly/i, 200);

    expect(euroValue('first-payment')).toBeGreaterThan(before);
  });
});
