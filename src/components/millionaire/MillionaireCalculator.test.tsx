import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { MillionaireCalculator } from './MillionaireCalculator';
import {
  useContributions,
  useConversion,
  useFunds,
  useMandateDeadlines,
  useMe,
  usePendingApplications,
  useRejoinPermission,
  useSavingsFundBalance,
  useSavingsFundOnboardingStatus,
  useSourceFunds,
  useTransactions,
} from '../common/apiHooks';
import {
  Application,
  Contribution,
  Conversion,
  Fund,
  RejoinPermission,
  SourceFund,
  Transaction,
  User,
  UserConversion,
} from '../common/apiModels';
import translations from '../translations';
import { createTrackedEvent } from '../common/api';
import { buildComparison, TULEVA_FEE } from './calculation';
import { derivePrefill } from './prefill';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useSourceFunds: jest.fn(),
  useContributions: jest.fn(),
  useConversion: jest.fn(),
  useFunds: jest.fn(),
  useMandateDeadlines: jest.fn(),
  usePendingApplications: jest.fn(),
  useRejoinPermission: jest.fn(),
  useSavingsFundOnboardingStatus: jest.fn(),
  useSavingsFundBalance: jest.fn(),
  useTransactions: jest.fn(),
}));

jest.mock('../common/api', () => ({
  createTrackedEvent: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: { labels: number[]; datasets: { data: number[] }[] } }) => {
    // Current-course line is drawn on top (index 0) so blue wins when the lines
    // coincide; Tuleva's line is index 1 underneath.
    const today = data.datasets[0].data;
    const laura = data.datasets[1].data;
    return (
      <div data-testid="mock-chart">
        <span data-testid="today-final">{Math.round(today[today.length - 1])}</span>
        <span data-testid="laura-final">{Math.round(laura[laura.length - 1])}</span>
        <span data-testid="chart-last-age">{data.labels[data.labels.length - 1]}</span>
        <span data-testid="chart-point-count">{laura.length}</span>
      </div>
    );
  },
}));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockUseSourceFunds = useSourceFunds as jest.MockedFunction<typeof useSourceFunds>;
const mockUseContributions = useContributions as jest.MockedFunction<typeof useContributions>;
const mockUseConversion = useConversion as jest.MockedFunction<typeof useConversion>;
const mockUseFunds = useFunds as jest.MockedFunction<typeof useFunds>;
const mockUseSavingsFundOnboardingStatus = useSavingsFundOnboardingStatus as jest.MockedFunction<
  typeof useSavingsFundOnboardingStatus
>;
const mockUseSavingsFundBalance = useSavingsFundBalance as jest.MockedFunction<
  typeof useSavingsFundBalance
>;
const mockUseTransactions = useTransactions as jest.MockedFunction<typeof useTransactions>;
const mockCreateTrackedEvent = createTrackedEvent as jest.MockedFunction<typeof createTrackedEvent>;
const mockUseMandateDeadlines = useMandateDeadlines as jest.MockedFunction<
  typeof useMandateDeadlines
>;
const mockUseRejoinPermission = useRejoinPermission as jest.MockedFunction<
  typeof useRejoinPermission
>;

const mockUsePendingApplications = usePendingApplications as jest.MockedFunction<
  typeof usePendingApplications
>;

const contributionsEnded = {
  contributing: false,
  restartDate: null,
  rejoinPossibleFrom: null,
};

const givenPendingApplications = (data: Application[] = [], isLoading = false) =>
  mockUsePendingApplications.mockReturnValue({ data, isLoading } as ReturnType<
    typeof usePendingApplications
  >);

const givenRejoinPermission = (data?: RejoinPermission, isInitialLoading = false) =>
  mockUseRejoinPermission.mockReturnValue({ data, isInitialLoading } as ReturnType<
    typeof useRejoinPermission
  >);

const REJOIN_PERMITTED: RejoinPermission = { permitted: true, decision: 'PERMITTED' };
const REJOIN_REFUSED: RejoinPermission = {
  permitted: false,
  decision: 'REFUSED_BY_PENSIONIKESKUS',
};
const REJOIN_IMPOSSIBLE: RejoinPermission = {
  permitted: false,
  decision: 'CONTRIBUTIONS_CANNOT_RESTART',
};

const givenSaverWhoseContributionsEnded = (rejoinPossibleFrom: string | null = null) =>
  mockUseMe.mockReturnValue({
    data: user({ secondPillarContributions: { ...contributionsEnded, rejoinPossibleFrom } }),
  } as ReturnType<typeof useMe>);

// Not converted to Tuleva in either pillar, so all three next steps are actionable.
const notAtTuleva = {
  selectionComplete: false,
  transfersComplete: false,
  contribution: { yearToDate: 0, lastYear: 0, total: 0 },
} as Conversion;
const conversion: UserConversion = {
  secondPillar: notAtTuleva,
  thirdPillar: notAtTuleva,
  weightedAverageFee: 0.01,
};
// Fully converted to Tuleva and contributing this year.
const atTulevaContributing = {
  selectionComplete: true,
  transfersComplete: true,
  contribution: { yearToDate: 500, lastYear: 6000, total: 12000 },
} as Conversion;

// Takes a history so a test can assert where a CTA actually took the saver.
const renderCalculator = (history = createMemoryHistory({ initialEntries: ['/millionaire'] })) => {
  render(
    <Router history={history}>
      <IntlProvider locale="en" messages={translations.en}>
        <MillionaireCalculator />
      </IntlProvider>
    </Router>,
  );
};

const user = (overrides: Partial<User> = {}): User =>
  ({
    age: 35,
    retirementAge: 67,
    secondPillarActive: true,
    secondPillarPaymentRates: { current: 2, pending: null },
    ...overrides,
  } as User);

const sourceFunds: SourceFund[] = [
  { pillar: 2, price: 12000, unavailablePrice: 0 } as SourceFund,
  { pillar: 3, price: 3000, unavailablePrice: 0 } as SourceFund,
];

const contributions: Contribution[] = [
  {
    pillar: 2,
    socialTaxPortion: 80, // gross 2000
    employeeWithheldPortion: 40,
    additionalParentalBenefit: 0,
    interest: 0,
    time: '2026-06-10T00:00:00Z',
    amount: 120,
    sender: 'Employer',
    currency: 'EUR',
  },
  { pillar: 3, amount: 1200, time: '2026-05-15T00:00:00Z', sender: 'Self', currency: 'EUR' },
];

// The same saver, but with the III pillar arriving month after month: a standing
// order. On a 2000 € gross the tax-deductible ceiling is 300 €/month, so 200 € a
// month is a monthly payer who still has room to raise it.
const monthlyContributions = (amount: number): Contribution[] => [
  ...contributions.filter((contribution) => contribution.pillar === 2),
  { pillar: 3, amount, time: '2026-06-05T00:00:00Z', sender: 'Self', currency: 'EUR' },
  { pillar: 3, amount, time: '2026-05-05T00:00:00Z', sender: 'Self', currency: 'EUR' },
  { pillar: 3, amount, time: '2026-04-05T00:00:00Z', sender: 'Self', currency: 'EUR' },
];

const now = new Date('2026-07-01T00:00:00Z');

const givenData = () => {
  mockUseMe.mockReturnValue({ data: user() } as ReturnType<typeof useMe>);
  mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
  mockUseContributions.mockReturnValue({
    data: contributions,
  } as ReturnType<typeof useContributions>);
  mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);
};

// Every pension step checked off: 6% into a Tuleva II pillar, plus a Tuleva III
// pillar being contributed to. This is what unlocks the savings-fund step.
const givenOptimizedPillars = () => {
  givenData();
  mockUseMe.mockReturnValue({
    data: user({ secondPillarPaymentRates: { current: 6, pending: null } }),
  } as ReturnType<typeof useMe>);
  mockUseConversion.mockReturnValue({
    data: {
      secondPillar: atTulevaContributing,
      thirdPillar: atTulevaContributing,
      weightedAverageFee: 0.0028,
    },
  } as ReturnType<typeof useConversion>);
};

// A saver who already holds savings fund units, worth 20 000 € today.
const savingsFundBalance = { price: 20000, unavailablePrice: 0, units: 1000 } as SourceFund;

// The savings fund is the fund with no pillar; that is how its transactions are known.
const SAVINGS_FUND_ISIN = 'EE0000003283';
const funds = [
  {
    isin: SAVINGS_FUND_ISIN,
    pillar: null,
    status: 'ACTIVE',
    ongoingChargesFigure: TULEVA_FEE,
    fundManager: { name: 'Tuleva' },
  } as Fund,
];
const savingsFundPayment = (amount: number, time: string) =>
  ({ isin: SAVINGS_FUND_ISIN, amount, time, type: 'CONTRIBUTION_CASH' } as Transaction);

const givenSavingsFund = (payments: Transaction[]) => {
  givenData();
  mockUseFunds.mockReturnValue({ data: funds } as ReturnType<typeof useFunds>);
  mockUseSavingsFundBalance.mockReturnValue({
    data: savingsFundBalance,
  } as ReturnType<typeof useSavingsFundBalance>);
  mockUseTransactions.mockReturnValue({ data: payments } as ReturnType<typeof useTransactions>);
};

const savingsFundSlider = () =>
  screen.getByRole('slider', { name: /Investment fund monthly/i }) as HTMLInputElement;

const comparisonFor = (
  saver: User,
  {
    annualReturnPercent = 0,
    recipeSecondPillarRate,
  }: {
    annualReturnPercent?: number;
    recipeSecondPillarRate?: number;
  } = {},
) =>
  buildComparison(
    {
      ...derivePrefill(saver, sourceFunds, contributions, now),
      annualReturnPercent,
      // Mirrors the component: pre-fill from the weighted-average fee (0.01 -> 1%).
      currentFundFeePercent: conversion.weightedAverageFee * 100,
      initialSavingsFundBalance: 0,
      savingsFundMonthly: 0,
      tulevaFee: TULEVA_FEE,
      savingsFundFee: TULEVA_FEE,
    },
    recipeSecondPillarRate,
  );

const expectedAtReturn = (annualReturnPercent: number) =>
  comparisonFor(user(), { annualReturnPercent });

describe('MillionaireCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    // CRA sets resetMocks: true, so implementations have to be re-armed here or
    // createTrackedEvent returns undefined and the fire-and-forget .catch() blows up.
    mockCreateTrackedEvent.mockResolvedValue(undefined);
    // getCurrentPath() reads the real jsdom location, which MemoryRouter never
    // touches; park it on the page under test so the tracked path is realistic.
    window.history.pushState({}, '', '/millionaire');
    mockUseConversion.mockReturnValue({ data: undefined } as ReturnType<typeof useConversion>);
    mockUseMandateDeadlines.mockReturnValue({
      data: { periodEnding: '2026-11-30T21:59:59.999Z' },
    } as ReturnType<typeof useMandateDeadlines>);
    givenRejoinPermission();
    givenPendingApplications();
    mockUseFunds.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useFunds>);
    mockUseSavingsFundOnboardingStatus.mockReturnValue({ data: { status: null } } as ReturnType<
      typeof useSavingsFundOnboardingStatus
    >);
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

  it('shows a loading state until user, funds and contributions have arrived', () => {
    mockUseMe.mockReturnValue({ data: undefined } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: undefined } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({ data: undefined } as ReturnType<
      typeof useContributions
    >);

    renderCalculator();

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('.shimmerDefault')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  it('still opens when the savings fund balance request fails', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    expect(screen.getByTestId('gap-message')).toBeInTheDocument();
  });

  it('pre-fills every input from the API data', () => {
    givenData();
    renderCalculator();

    expect((screen.getByLabelText(/^Gross monthly salary$/i) as HTMLInputElement).value).toBe(
      '2000',
    );
    expect(screen.getByRole('button', { name: '2%' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '6%' })).toHaveAttribute('aria-pressed', 'false');
    expect(
      (screen.getByRole('slider', { name: /Expected annual return/i }) as HTMLInputElement).value,
    ).toBe('0');
    expect(
      (
        screen.getByRole('slider', {
          name: /III.pillar monthly/i,
        }) as HTMLInputElement
      ).value,
    ).toBe('100');
  });

  it('renders both projection lines matching the calculation for the default 0% return', () => {
    givenData();
    renderCalculator();

    const expected = expectedAtReturn(0);
    expect(Number(screen.getByTestId('today-final').textContent)).toBe(
      Math.round(expected.today.total),
    );
    expect(Number(screen.getByTestId('laura-final').textContent)).toBe(
      Math.round(expected.laura.total),
    );
    expect(screen.getByTestId('chart-last-age')).toHaveTextContent('67');
    expect(screen.getByTestId('chart-point-count')).toHaveTextContent(String(67 - 35 + 1));
  });

  it('leaves the savings fund out entirely for a saver who has no units', () => {
    givenData();
    renderCalculator();

    expect(
      screen.queryByRole('slider', { name: /Investment fund monthly/i }),
    ).not.toBeInTheDocument();
  });

  it('counts an existing savings fund balance and lets the saver add to it monthly', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: savingsFundBalance,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const withoutFund = Number(screen.getByTestId('laura-final').textContent);
    expect(withoutFund).toBe(
      Math.round(
        buildComparison({
          ...derivePrefill(user(), sourceFunds, contributions, now),
          annualReturnPercent: 0,
          currentFundFeePercent: conversion.weightedAverageFee * 100,
          initialSavingsFundBalance: 20000,
          savingsFundMonthly: 0,
          tulevaFee: TULEVA_FEE,
          savingsFundFee: TULEVA_FEE,
        }).laura.total,
      ),
    );

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(screen.getByRole('slider', { name: /Investment fund monthly/i }), {
      target: { value: '200' },
    });

    expect(Number(screen.getByTestId('laura-final').textContent)).toBeGreaterThan(withoutFund);
  });

  it('lets a power user click the savings fund amount and type past the slider cap', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: savingsFundBalance,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const before = Number(screen.getByTestId('laura-final').textContent);
    const amount = screen.getByRole('textbox', { name: /Investment fund monthly/i });
    // 5000 is well above the slider's 1000 cap: the click-to-edit is the only way there.
    amount.textContent = '5000';
    // The chart follows each keystroke, so the input event alone (no Enter/blur) updates it.
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.input(amount);

    const withSavings = Number(screen.getByTestId('laura-final').textContent);
    const expected = buildComparison({
      ...derivePrefill(user(), sourceFunds, contributions, now),
      annualReturnPercent: 0,
      currentFundFeePercent: conversion.weightedAverageFee * 100,
      initialSavingsFundBalance: 20000,
      savingsFundMonthly: 5000,
      tulevaFee: TULEVA_FEE,
      savingsFundFee: TULEVA_FEE,
    }).laura.total;
    expect(withSavings).toBe(Math.round(expected));
    expect(withSavings).toBeGreaterThan(before);
  });

  it('clamps the typed savings fund amount to four digits while typing', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: savingsFundBalance,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const amount = screen.getByRole('textbox', { name: /Investment fund monthly/i });
    amount.textContent = '12345'; // a fifth digit would overflow the layout
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.input(amount);

    // The display itself snaps back to the cap, not just the value behind it.
    expect(amount).toHaveTextContent(/^9999$/);
    const clamped = buildComparison({
      ...derivePrefill(user(), sourceFunds, contributions, now),
      annualReturnPercent: 0,
      currentFundFeePercent: conversion.weightedAverageFee * 100,
      initialSavingsFundBalance: 20000,
      savingsFundMonthly: 9999,
      tulevaFee: TULEVA_FEE,
      savingsFundFee: TULEVA_FEE,
    }).laura.total;
    expect(Number(screen.getByTestId('laura-final').textContent)).toBe(Math.round(clamped));
  });

  it('sanitises whatever gets typed into the savings fund amount', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: savingsFundBalance,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const amount = screen.getByRole('textbox', { name: /Investment fund monthly/i });
    // Every case rewrites the visible text to its canonical digits so nothing can overflow
    // the layout or leave stray characters behind, whatever the saver pastes or types.
    const cases: Array<[string, string]> = [
      ['250', '250'], // in range: untouched
      ['9999', '9999'], // exactly the cap: untouched
      ['12345', '9999'], // over the cap: clamped
      ['0000012345', '9999'], // leading zeros hide the overflow: still clamped
      ['000500', '500'], // leading zeros stripped
      ['-500', '500'], // minus sign stripped, never negative
      ['1a2b3', '123'], // letters stripped
      ['1 234', '1234'], // spaces (a pasted separator) stripped
    ];
    cases.forEach(([typed, shown]) => {
      amount.textContent = typed;
      // eslint-disable-next-line testing-library/prefer-user-event
      fireEvent.input(amount);
      expect(amount).toHaveTextContent(new RegExp(`^${shown}$`));
    });
  });

  it('keeps the euro sign out of the editable number', () => {
    givenData();
    mockUseSavingsFundBalance.mockReturnValue({
      data: savingsFundBalance,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const amount = screen.getByRole('textbox', { name: /Investment fund monthly/i });
    // Only digits are editable; the "€" sits beside the field, not inside it.
    expect(amount).not.toHaveTextContent('€');
    // eslint-disable-next-line testing-library/no-node-access
    expect(amount.parentElement).toHaveTextContent('€');
  });

  it("takes Tuleva's fee from the live fund list rather than a hardcoded constant", () => {
    givenData();
    // Tuleva halves its fee: the recipe must get cheaper without anyone editing code.
    mockUseFunds.mockReturnValue({
      data: [
        { ...funds[0], pillar: 2, isin: 'EE3600109435', ongoingChargesFigure: 0.0014 } as Fund,
      ],
    } as ReturnType<typeof useFunds>);

    renderCalculator();

    const expected = buildComparison({
      ...derivePrefill(user(), sourceFunds, contributions, now),
      annualReturnPercent: 0,
      // The saver's own fee is clamped into the (now single-fund) live fee bounds.
      currentFundFeePercent: 0.14,
      initialSavingsFundBalance: 0,
      savingsFundMonthly: 0,
      tulevaFee: 0.0014,
      savingsFundFee: TULEVA_FEE, // no savings fund in the list, so the fallback stands
    });
    expect(Number(screen.getByTestId('laura-final').textContent)).toBe(
      Math.round(expected.laura.total),
    );
  });

  it('still opens when the fund list and transaction history fail to load', () => {
    givenData();
    // A failed query settles with no data: the savings fund pre-fill is all we lose, so
    // the calculator must still render rather than shimmer forever.
    mockUseFunds.mockReturnValue({ data: undefined, isLoading: false } as ReturnType<
      typeof useFunds
    >);
    mockUseTransactions.mockReturnValue({ data: undefined, isLoading: false } as ReturnType<
      typeof useTransactions
    >);

    renderCalculator();

    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('starts the savings fund slider at zero for a saver who paid in one lump sum', () => {
    givenSavingsFund([savingsFundPayment(20000, '2026-06-15T00:00:00Z')]);

    renderCalculator();

    // 20 000 € arriving once is wealth moving in, not a habit: projecting it as 1667 €
    // (or, clamped, 1000 €) every month for 32 years would invent savings they never make.
    expect(savingsFundSlider().value).toBe('0');
  });

  it('pre-fills the savings fund slider from a standing order', () => {
    givenSavingsFund([
      savingsFundPayment(200, '2026-06-05T00:00:00Z'),
      savingsFundPayment(200, '2026-05-05T00:00:00Z'),
      savingsFundPayment(200, '2026-04-05T00:00:00Z'),
    ]);

    renderCalculator();

    expect(savingsFundSlider().value).toBe('200');
  });

  it('tells an under-contributing saver they could gain more with the recipe', () => {
    givenData();
    renderCalculator();

    expect(screen.getByTestId('gap-message')).toHaveTextContent(/more/i);
  });

  it('recomputes the projection when the return slider moves', () => {
    givenData();
    renderCalculator();

    const before = Number(screen.getByTestId('laura-final').textContent);
    // fireEvent is the right tool for a range input — userEvent has no slider set.
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(screen.getByRole('slider', { name: /Expected annual return/i }), {
      target: { value: '7' },
    });
    const after = Number(screen.getByTestId('laura-final').textContent);

    expect(after).toBe(Math.round(expectedAtReturn(7).laura.total));
    expect(after).toBeGreaterThan(before);
  });

  it('recomputes when the II pillar rate changes', () => {
    givenData();
    renderCalculator();

    const before = Number(screen.getByTestId('today-final').textContent);
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('button', { name: '6%' }));
    const after = Number(screen.getByTestId('today-final').textContent);

    expect(screen.getByRole('button', { name: '6%' })).toHaveAttribute('aria-pressed', 'true');
    expect(after).toBeGreaterThan(before);
  });

  it('de-selects the active II rate on a second click, dropping II contributions', () => {
    givenData();
    renderCalculator();

    const before = Number(screen.getByTestId('today-final').textContent);
    // The user starts at 2%; clicking it again toggles the II pillar off.
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('button', { name: '2%' }));
    const after = Number(screen.getByTestId('today-final').textContent);

    expect(screen.getByRole('button', { name: '2%' })).toHaveAttribute('aria-pressed', 'false');
    expect(after).toBeLessThan(before);
  });

  it('still lists the next steps for someone past retirement age', () => {
    givenData();
    // The projection is over, but a high fund fee costs them more than ever at their peak
    // balance, and they can still switch funds and pay into the III pillar.
    mockUseMe.mockReturnValue({
      data: user({ age: 68, retirementAge: 67 }),
    } as ReturnType<typeof useMe>);

    renderCalculator();

    expect(screen.getByTestId('cta-item-secondPillarToTuleva')).toBeInTheDocument();
    expect(screen.getByTestId('cta-item-thirdPillarToTuleva')).toBeInTheDocument();
  });

  it('shows a retirement notice instead of a chart for someone past retirement age', () => {
    mockUseMe.mockReturnValue({
      data: user({ age: 68, retirementAge: 67 }),
    } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({
      data: contributions,
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);

    renderCalculator();

    expect(screen.getByText(/already reached retirement age/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  it('lists the concrete next steps as links for a saver not yet at Tuleva', () => {
    givenData();
    renderCalculator();

    const linkIn = (testId: string) =>
      within(screen.getByTestId(testId)).getByRole('link') as HTMLAnchorElement;

    expect(screen.getByTestId('cta-item-secondPillarToTuleva')).toHaveAttribute(
      'data-done',
      'false',
    );
    expect(linkIn('cta-item-secondPillarToTuleva')).toHaveAttribute('href', '/2nd-pillar-flow');
    expect(linkIn('cta-item-raiseSecondPillar')).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
    expect(linkIn('cta-item-thirdPillarToTuleva')).toHaveAttribute('href', '/3rd-pillar-flow');
  });

  it('tracks which next step the saver clicked', () => {
    givenData();
    renderCalculator();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('link', { name: 'Switch to Tuleva' }));

    expect(mockCreateTrackedEvent).toHaveBeenCalledWith('CLICK', {
      path: '/millionaire',
      target: 'millionaireCalculator.ctaButton',
      value: 'secondPillarToTuleva',
      url: '/2nd-pillar-flow',
    });
  });

  it('tracks each next step separately, so sends can tell them apart', () => {
    givenData();
    renderCalculator();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('link', { name: 'Raise my contribution' }));
    // The label carries a non-breaking space, so match it with \s rather than ' '.
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('link', { name: /Open a III\spillar/ }));

    expect(mockCreateTrackedEvent).toHaveBeenCalledTimes(2);
    expect(mockCreateTrackedEvent).toHaveBeenNthCalledWith(
      1,
      'CLICK',
      expect.objectContaining({ value: 'raiseSecondPillar', url: '/2nd-pillar-payment-rate' }),
    );
    expect(mockCreateTrackedEvent).toHaveBeenNthCalledWith(
      2,
      'CLICK',
      expect.objectContaining({ value: 'thirdPillarToTuleva', url: '/3rd-pillar-flow' }),
    );
  });

  it('tracks the II pillar rate the saver picked', () => {
    givenData();
    renderCalculator();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('button', { name: '6%' }));

    expect(mockCreateTrackedEvent).toHaveBeenCalledWith('CLICK', {
      path: '/millionaire',
      target: 'millionaireCalculator.setSecondPillarRate',
      value: 6,
    });
  });

  // The arrow shortcut is aria-hidden, so only the hint link is reachable by role;
  // `source` is what separates the two in the analytics.
  it('marks the hint link as the source when it sets the historical return', () => {
    givenData();
    renderCalculator();

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('button', { name: /return 7%/ }));

    expect(mockCreateTrackedEvent).toHaveBeenCalledWith('CLICK', {
      path: '/millionaire',
      target: 'millionaireCalculator.setHistoricalReturn',
      value: 7,
      source: 'hintLink',
    });
  });

  it('keeps quiet until the saver actually interacts', () => {
    givenData();
    renderCalculator();

    expect(mockCreateTrackedEvent).not.toHaveBeenCalled();
  });

  it('still navigates when tracking fails', () => {
    mockCreateTrackedEvent.mockRejectedValueOnce(new Error('tracking is down'));
    givenData();
    const history = createMemoryHistory({ initialEntries: ['/millionaire'] });
    renderCalculator(history);

    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(screen.getByRole('link', { name: 'Switch to Tuleva' }));

    expect(history.location.pathname).toBe('/2nd-pillar-flow');
  });

  it('checks off raising the II pillar rate once the saver already contributes 6%', () => {
    mockUseMe.mockReturnValue({
      data: user({ secondPillarPaymentRates: { current: 6, pending: null } }),
    } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({
      data: contributions,
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);

    renderCalculator();

    const raiseRow = screen.getByTestId('cta-item-raiseSecondPillar');
    expect(raiseRow).toHaveAttribute('data-done', 'true');
    expect(within(raiseRow).queryByRole('link')).not.toBeInTheDocument();
  });

  it('names the fund switch deadline the register has set', () => {
    givenData();

    renderCalculator();

    expect(screen.getByTestId('cta-item-secondPillarToTuleva')).toHaveTextContent(
      'The II pillar switch deadline is November 30 at 21:59',
    );
  });

  it('keeps the fund switch step without a deadline until the deadlines load', () => {
    givenData();
    mockUseMandateDeadlines.mockReturnValue({ data: undefined } as ReturnType<
      typeof useMandateDeadlines
    >);

    renderCalculator();

    const step = screen.getByTestId('cta-item-secondPillarToTuleva');
    expect(step).not.toHaveTextContent(/deadline/);
    expect(within(step).getByRole('link')).toHaveAttribute('href', '/2nd-pillar-flow');
  });

  it('offers rejoining instead of both II pillar steps when contributions have ended', () => {
    givenData();
    givenSaverWhoseContributionsEnded();
    givenRejoinPermission(REJOIN_PERMITTED);

    renderCalculator();

    expect(
      within(screen.getByTestId('cta-item-rejoinSecondPillar')).getByRole('link', {
        name: 'Rejoin',
      }),
    ).toHaveAttribute('href', '/2nd-pillar-rejoin');
    expect(screen.queryByTestId('cta-item-secondPillarToTuleva')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cta-item-raiseSecondPillar')).not.toBeInTheDocument();
  });

  it('offers rejoining when the register cannot say whether it is permitted', () => {
    givenData();
    givenSaverWhoseContributionsEnded();
    givenRejoinPermission(undefined);

    renderCalculator();

    expect(screen.getByTestId('cta-item-rejoinSecondPillar')).toBeInTheDocument();
  });

  it('holds the calculator back until the rejoin answer arrives', () => {
    givenData();
    givenSaverWhoseContributionsEnded();
    givenRejoinPermission(undefined, true);

    renderCalculator();

    expect(screen.queryByRole('heading', { name: 'Your next steps' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  it('holds the calculator back until the pending applications arrive', () => {
    givenData();
    givenSaverWhoseContributionsEnded();
    givenPendingApplications([], true);

    renderCalculator();

    expect(screen.queryByRole('heading', { name: 'Your next steps' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
  });

  it('does not ask about rejoining for a saver who still contributes', () => {
    givenData();

    renderCalculator();

    expect(mockUseRejoinPermission).toHaveBeenCalledWith({ enabled: false });
    expect(screen.queryByTestId('cta-item-rejoinSecondPillar')).not.toBeInTheDocument();
  });

  it('asks about rejoining for a saver whose contributions have ended', () => {
    givenData();
    givenSaverWhoseContributionsEnded();

    renderCalculator();

    expect(mockUseRejoinPermission).toHaveBeenCalledWith({ enabled: true });
  });

  it('asks about rejoining only once the pending applications have arrived', () => {
    givenData();
    givenSaverWhoseContributionsEnded();
    givenPendingApplications([], true);

    renderCalculator();

    expect(mockUseRejoinPermission).toHaveBeenCalledWith({ enabled: false });
  });

  it('does not hold a contributing saver back for the pending applications', () => {
    givenData();
    givenPendingApplications([], true);

    renderCalculator();

    expect(screen.getByRole('heading', { name: 'Your next steps' })).toBeInTheDocument();
  });

  const expectRejoinedStep = () => {
    const step = screen.getByTestId('cta-item-rejoinSecondPillar');
    expect(step).toHaveAttribute('data-done', 'true');
    expect(step).toHaveTextContent(/Contributions start on .*2027/);
    expect(within(step).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cta-item-secondPillarToTuleva')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cta-item-raiseSecondPillar')).not.toBeInTheDocument();
  };

  it('shows the restart date with nothing to click once contributions have one', () => {
    givenData();
    mockUseMe.mockReturnValue({
      data: user({
        secondPillarContributions: {
          contributing: false,
          restartDate: '2027-05-01',
          rejoinPossibleFrom: null,
        },
      }),
    } as ReturnType<typeof useMe>);

    renderCalculator();

    expectRejoinedStep();
  });

  describe('a saver who has already filed to rejoin', () => {
    const rejoinApplication = {
      type: 'REJOIN',
      details: { fulfillmentDate: '2027-05-01' },
    } as Application;

    const givenFiledToRejoin = () => {
      givenData();
      givenSaverWhoseContributionsEnded();
      givenRejoinPermission(REJOIN_PERMITTED);
      givenPendingApplications([rejoinApplication]);
    };

    it('sees when contributions start instead of being sent to rejoin or switch funds', () => {
      givenFiledToRejoin();

      renderCalculator();

      expectRejoinedStep();
    });

    it('starts from the II rate they filed', () => {
      givenFiledToRejoin();

      renderCalculator();

      expect(screen.getByRole('button', { name: '2%' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('is offered the savings fund once the III pillar is sorted', () => {
      givenMonthlyThirdPillar(300);
      givenSaverWhoseContributionsEnded();
      givenPendingApplications([rejoinApplication]);

      renderCalculator();

      expect(screen.getByTestId('cta-item-savingsFund')).toBeInTheDocument();
    });
  });

  describe('a saver who must wait before rejoining', () => {
    const givenMustWait = () => {
      givenData();
      givenSaverWhoseContributionsEnded('2028-09-01');
      givenRejoinPermission(REJOIN_REFUSED);
    };

    it('sees the date they can rejoin from, with nothing to click yet', () => {
      givenMustWait();

      renderCalculator();

      const step = screen.getByTestId('cta-item-rejoinSecondPillar');
      expect(step).toHaveTextContent(/You can rejoin from .*2028/);
      expect(within(step).queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cta-item-raiseSecondPillar')).not.toBeInTheDocument();
    });

    it('keeps II pillar money in the recipe', () => {
      givenMustWait();
      const waiting = user({
        secondPillarContributions: { ...contributionsEnded, rejoinPossibleFrom: '2028-09-01' },
      });

      renderCalculator();

      expect(screen.getByTestId('laura-final')).toHaveTextContent(
        String(Math.round(comparisonFor(waiting).laura.total)),
      );
    });

    it('can still try out II pillar rates', () => {
      givenMustWait();

      renderCalculator();

      expect(screen.getByRole('button', { name: '6%' })).toBeInTheDocument();
    });

    it('is offered the savings fund, as waiting leaves nothing to do in the pillars', () => {
      givenMonthlyThirdPillar(300);
      givenSaverWhoseContributionsEnded('2028-09-01');
      givenRejoinPermission(REJOIN_REFUSED);

      renderCalculator();

      expect(screen.getByTestId('cta-item-savingsFund')).toBeInTheDocument();
    });
  });

  describe.each([
    ['contributions cannot restart', REJOIN_IMPOSSIBLE, '2028-09-01'],
    ['rejoining is refused with no date to wait for', REJOIN_REFUSED, null],
    ['the date to rejoin from has passed yet rejoining is refused', REJOIN_REFUSED, '2026-06-01'],
  ])('when %s', (_, permission, rejoinPossibleFrom) => {
    const givenSecondPillarOutOfReach = () => {
      givenData();
      givenSaverWhoseContributionsEnded(rejoinPossibleFrom);
      givenRejoinPermission(permission);
    };

    it('drops every II pillar step', () => {
      givenSecondPillarOutOfReach();

      renderCalculator();

      expect(screen.queryByTestId('cta-item-rejoinSecondPillar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cta-item-secondPillarToTuleva')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cta-item-raiseSecondPillar')).not.toBeInTheDocument();
      expect(screen.getByTestId('cta-item-thirdPillarToTuleva')).toBeInTheDocument();
    });

    it('leaves II pillar money out of the recipe', () => {
      givenSecondPillarOutOfReach();
      const leaver = user({
        secondPillarContributions: { ...contributionsEnded, rejoinPossibleFrom },
      });

      renderCalculator();

      expect(screen.getByTestId('laura-final')).toHaveTextContent(
        String(Math.round(comparisonFor(leaver, { recipeSecondPillarRate: 0 }).laura.total)),
      );
    });

    it('offers no II pillar rates to try', () => {
      givenSecondPillarOutOfReach();

      renderCalculator();

      expect(screen.queryByRole('group', { name: /II\spillar of salary/ })).not.toBeInTheDocument();
    });
  });

  it('keeps both II pillar steps for a saver who never joined it', () => {
    givenData();
    mockUseMe.mockReturnValue({
      data: user({ secondPillarActive: false, secondPillarContributions: null }),
    } as ReturnType<typeof useMe>);

    renderCalculator();

    expect(
      within(screen.getByTestId('cta-item-secondPillarToTuleva')).getByRole('link'),
    ).toHaveAttribute('href', '/2nd-pillar-flow');
    expect(screen.getByTestId('cta-item-raiseSecondPillar')).toBeInTheDocument();
  });

  it('offers the savings fund once the III pillar is sorted and rejoining is impossible', () => {
    givenMonthlyThirdPillar(300);
    givenSaverWhoseContributionsEnded();
    givenRejoinPermission(REJOIN_IMPOSSIBLE);

    renderCalculator();

    expect(screen.getByTestId('cta-item-savingsFund')).toBeInTheDocument();
  });

  it('counts a monthly payer as contributing before this year first payment lands', () => {
    // Every January a standing order's last payments are all in the old year, so
    // year-to-date is zero. The step must not read "you pay every month" while unchecked.
    givenData();
    mockUseContributions.mockReturnValue({
      data: monthlyContributions(300),
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({
      data: {
        secondPillar: notAtTuleva,
        thirdPillar: { ...atTulevaContributing, contribution: { yearToDate: 0, lastYear: 3600 } },
        weightedAverageFee: 0.003,
      },
    } as unknown as ReturnType<typeof useConversion>);

    renderCalculator();

    const thirdRow = screen.getByTestId('cta-item-thirdPillarToTuleva');
    expect(thirdRow).toHaveAttribute('data-done', 'true');
    expect(thirdRow).toHaveTextContent(/every month/i);
  });

  it('checks off the III pillar but keeps its standing-order CTA when contributing at Tuleva', () => {
    mockUseMe.mockReturnValue({ data: user() } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({
      data: contributions,
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({
      data: {
        secondPillar: notAtTuleva,
        thirdPillar: atTulevaContributing,
        weightedAverageFee: 0.003,
      },
    } as ReturnType<typeof useConversion>);

    renderCalculator();

    const thirdRow = screen.getByTestId('cta-item-thirdPillarToTuleva');
    expect(thirdRow).toHaveAttribute('data-done', 'true');
    // Green check, but still nudged to grow the standing order (pre-selecting recurring).
    expect(within(thirdRow).getByRole('link')).toHaveAttribute(
      'href',
      '/3rd-pillar-payment?type=RECURRING',
    );
  });

  const givenMonthlyThirdPillar = (amount: number) => {
    givenData();
    mockUseContributions.mockReturnValue({
      data: monthlyContributions(amount),
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({
      data: {
        secondPillar: notAtTuleva,
        thirdPillar: atTulevaContributing,
        weightedAverageFee: 0.003,
      },
    } as ReturnType<typeof useConversion>);
  };

  it('drops the standing-order CTA for a saver already paying into the III pillar monthly', () => {
    givenMonthlyThirdPillar(300); // the whole tax-deductible ceiling on a 2000 € gross

    renderCalculator();

    const thirdRow = screen.getByTestId('cta-item-thirdPillarToTuleva');
    expect(thirdRow).toHaveAttribute('data-done', 'true');
    // The standing order already exists, so there is nothing left to set up.
    expect(within(thirdRow).queryByRole('link')).not.toBeInTheDocument();
    expect(thirdRow).toHaveTextContent(/every month/i);
  });

  it('tells a monthly payer below the ceiling to raise the standing order in their bank', () => {
    givenMonthlyThirdPillar(200);

    renderCalculator();

    const thirdRow = screen.getByTestId('cta-item-thirdPillarToTuleva');
    expect(thirdRow).toHaveAttribute('data-done', 'true');
    // Only their own bank can change a standing order, so we instruct instead of link.
    expect(within(thirdRow).queryByRole('link')).not.toBeInTheDocument();
    expect(thirdRow).toHaveTextContent(/Raise your standing order to 300/);
  });

  it('hides the savings fund step while any pension step is still open', () => {
    givenData();
    renderCalculator();

    expect(screen.queryByTestId('cta-item-savingsFund')).not.toBeInTheDocument();
  });

  it('offers the savings fund as a fourth step once every pension step is done', () => {
    givenOptimizedPillars();
    renderCalculator();

    const savingsRow = screen.getByTestId('cta-item-savingsFund');
    expect(savingsRow).toHaveAttribute('data-done', 'false');
    expect(within(savingsRow).getByRole('link')).toHaveAttribute(
      'href',
      '/savings-fund/onboarding',
    );
  });

  it('asks for a first deposit from a saver who joined the savings fund but never paid in', () => {
    givenOptimizedPillars();
    mockUseSavingsFundOnboardingStatus.mockReturnValue({
      data: { status: 'COMPLETED' },
    } as ReturnType<typeof useSavingsFundOnboardingStatus>);

    renderCalculator();

    const savingsRow = screen.getByTestId('cta-item-savingsFund');
    expect(savingsRow).toHaveAttribute('data-done', 'false');
    // First get money in; the standing-order nudge comes once they are actually saving.
    expect(within(savingsRow).getByRole('link')).toHaveAttribute('href', '/savings-fund/payment');
  });

  it('checks off the savings fund step for a saver who already invests there', () => {
    givenOptimizedPillars();
    mockUseSavingsFundOnboardingStatus.mockReturnValue({
      data: { status: 'COMPLETED' },
    } as ReturnType<typeof useSavingsFundOnboardingStatus>);
    mockUseSavingsFundBalance.mockReturnValue({
      data: { units: 120, contributions: 5000 } as SourceFund,
    } as ReturnType<typeof useSavingsFundBalance>);

    renderCalculator();

    const savingsRow = screen.getByTestId('cta-item-savingsFund');
    expect(savingsRow).toHaveAttribute('data-done', 'true');
    // A lump-sum saver is nudged into a standing order, with recurring pre-selected.
    expect(within(savingsRow).getByRole('link')).toHaveAttribute(
      'href',
      '/savings-fund/payment?type=RECURRING',
    );
  });
});
