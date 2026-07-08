import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { MillionaireCalculator } from './MillionaireCalculator';
import {
  useContributions,
  useConversion,
  useFunds,
  useMe,
  useSourceFunds,
} from '../common/apiHooks';
import { Contribution, Conversion, SourceFund, User, UserConversion } from '../common/apiModels';
import translations from '../translations';
import { buildComparison } from './calculation';
import { derivePrefill } from './prefill';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useSourceFunds: jest.fn(),
  useContributions: jest.fn(),
  useConversion: jest.fn(),
  useFunds: jest.fn(),
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

const renderCalculator = () =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={translations.en}>
        <MillionaireCalculator />
      </IntlProvider>
    </MemoryRouter>,
  );

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

const now = new Date('2026-07-01T00:00:00Z');

const givenData = () => {
  mockUseMe.mockReturnValue({ data: user() } as ReturnType<typeof useMe>);
  mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
  mockUseContributions.mockReturnValue({
    data: contributions,
  } as ReturnType<typeof useContributions>);
  mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);
};

const expectedAtReturn = (annualReturnPercent: number) =>
  buildComparison({
    ...derivePrefill(user(), sourceFunds, contributions, now),
    annualReturnPercent,
    // Mirrors the component: pre-fill from the weighted-average fee (0.01 -> 1%).
    currentFundFeePercent: conversion.weightedAverageFee * 100,
  });

describe('MillionaireCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockUseConversion.mockReturnValue({ data: undefined } as ReturnType<typeof useConversion>);
    mockUseFunds.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useFunds>);
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

  it('pre-fills every input from the API data', () => {
    givenData();
    renderCalculator();

    expect((screen.getByLabelText(/^Gross salary$/i) as HTMLInputElement).value).toBe('2000');
    expect(screen.getByRole('button', { name: '2%' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '6%' })).toHaveAttribute('aria-pressed', 'false');
    expect(
      (screen.getByRole('slider', { name: /Expected annual return/i }) as HTMLInputElement).value,
    ).toBe('0');
    expect(
      (
        screen.getByRole('slider', {
          name: /III.pillar per month/i,
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

  it('keeps the raise-II step actionable for a saver who has left the funded II pillar', () => {
    // Stored rate is 6% but the saver is inactive, so they contribute nothing.
    mockUseMe.mockReturnValue({
      data: user({
        secondPillarActive: false,
        secondPillarPaymentRates: { current: 6, pending: null },
      }),
    } as ReturnType<typeof useMe>);
    mockUseSourceFunds.mockReturnValue({ data: sourceFunds } as ReturnType<typeof useSourceFunds>);
    mockUseContributions.mockReturnValue({
      data: contributions,
    } as ReturnType<typeof useContributions>);
    mockUseConversion.mockReturnValue({ data: conversion } as ReturnType<typeof useConversion>);

    renderCalculator();

    const raiseRow = screen.getByTestId('cta-item-raiseSecondPillar');
    expect(raiseRow).toHaveAttribute('data-done', 'false');
    expect(within(raiseRow).getByRole('link')).toHaveAttribute('href', '/2nd-pillar-payment-rate');
  });

  it('checks off the III pillar but keeps its standing-order CTA when contributing at Tuleva', () => {
    const atTulevaContributing = {
      selectionComplete: true,
      transfersComplete: true,
      contribution: { yearToDate: 500, lastYear: 6000, total: 12000 },
    } as Conversion;
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
});
