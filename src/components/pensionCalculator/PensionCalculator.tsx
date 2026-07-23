import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  Plugin,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { formatAmountForCurrency } from '../common/utils';
import { CurrencyInput } from '../common/input/CurrencyInput';
import { EditableEuro } from '../common/input/EditableEuro';
import { InfoTooltip } from '../common/infoTooltip/InfoTooltip';
import { Shimmer } from '../common/shimmer/Shimmer';
import {
  useCapitalEvents,
  useCapitalRows,
  useContributions,
  useConversion,
  useFunds,
  useMe,
  useSavingsFundBalance,
  useSourceFunds,
  useTransactions,
} from '../common/apiHooks';
import { SourceFund } from '../common/apiModels';
import {
  deriveFeeBounds,
  deriveGrossSalary,
  deriveSavingsFundMonthly,
  deriveThirdPillarMonthly,
  deriveTulevaFees,
  selectSavingsFundFlows,
  selectSavingsFundPayments,
} from '../millionaire/prefill';
import './PensionCalculator.scss';
import {
  buildHistory,
  CalculatorInputs,
  DEFAULT_INFLATION_PERCENT,
  DEFAULT_RETURN_PERCENT,
  MAX_SALARY,
  MEMBERSHIP_BONUS_RATE,
  project,
  projectedRemainingYears,
  projectedRetirementAge,
  RETIREMENT_AGE_DEFAULT,
  SMART_PAYOUT_HORIZON_AGE,
  SECOND_PILLAR_RATES,
  thirdPillarTaxCapMonthly,
} from './calculation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// The "Laura" brand illustration palette, shared with the II pillar growth page so
// a pillar is the same colour wherever a saver meets it.
const COLOR_SECOND = '#00AEEA';
const COLOR_THIRD = '#FDD835';
const COLOR_SAVINGS = '#52A560';
// Member capital becomes an inheritance in this model, so it borrows the II pillar
// growth page's inheritance orange. Stacked on top, above the green savings band, it
// stays clear of the yellow III band it would otherwise sit beside.
const COLOR_MEMBER_CAPITAL = '#F29B0F';
// Semi-transparent, not a lighter gray: the lines cross the coloured areas, so a
// flat light tone washes out on them while a solid dark one shouts. Alpha keeps
// the line visible over blue, yellow and green alike, and soft over the white top.
const COLOR_MARKER_LINE = 'rgba(33, 37, 41, 0.3)';

// `as const` keeps the ids literal, so they still typecheck as TranslationKeys.
const PILLAR_LEGEND = [
  { key: 'secondPillar', color: COLOR_SECOND, id: 'pensionCalculator.pillar.second' },
  { key: 'thirdPillar', color: COLOR_THIRD, id: 'pensionCalculator.pillar.third' },
  { key: 'savingsFund', color: COLOR_SAVINGS, id: 'pensionCalculator.pillar.savingsFund' },
  {
    key: 'memberCapital',
    color: COLOR_MEMBER_CAPITAL,
    id: 'pensionCalculator.pillar.memberCapital',
  },
] as const;

const HOW_IT_WORKS = [
  {
    heading: 'pensionCalculator.how.accumulation.heading',
    body: 'pensionCalculator.how.accumulation.body',
  },
  {
    heading: 'pensionCalculator.how.withdrawal.heading',
    body: 'pensionCalculator.how.withdrawal.body',
  },
  { heading: 'pensionCalculator.how.tax.heading', body: 'pensionCalculator.how.tax.body' },
] as const;

const RETURN_MIN = -10;
const RETURN_MAX = 10;
const RETURN_STEP = 1;
const HISTORICAL_RETURN = 7; // long-run historical stock return, marked on the slider
const HISTORICAL_RETURN_LEFT = ((HISTORICAL_RETURN - RETURN_MIN) / (RETURN_MAX - RETURN_MIN)) * 100;
const FEE_STEP = 0.01;
// Paindlik pension: the state pension can start up to five years before the
// statutory age or be deferred past it, so the slider runs statutory ±5.
const PAINDLIK_PENSION_YEARS = 5;
// No statutory minimum exists: shorter periods are legal and simply taxed at 10%
// below the recommended duration, so the floor is only what a slider needs.
const WITHDRAWAL_YEARS_MIN = 1;
const WITHDRAWAL_YEARS_MAX = 30;
const MONTHLY_STEP = 10;
const SAVINGS_FUND_MAX_MONTHLY = 1000;
const DEFAULT_GROSS_SALARY = 2000;
// A whole-percent slider models a 30-year AVERAGE, and averages are coarse: the euro
// area has never sustained multi-decade deflation (the ECB targets 2%), so the floor
// is 0, and a 6% lifetime average is already the grim end of realistic.
const INFLATION_MAX = 6;
const INFLATION_STEP = 1;

const formatEuro = (value: number, fractionDigits = 0): string => {
  const formatted = formatAmountForCurrency(value, fractionDigits);
  // Estonian drops the thousands separator below 10 000: "6000", but "10 000".
  return Math.abs(value) < 10000 ? formatted.replace(/(\d)\u00A0(\d)/g, '$1$2') : formatted;
};

// The projection is illustrative, so exact euros would be false precision. Floor
// (never round up, to stay conservative) to a readable step.
const roundedEuro = (value: number): string => {
  const magnitude = Math.abs(value);
  // Step down with the number: flooring a EUR 600 tax bill to the nearest 1000
  // would print "0 EUR" next to a warning that tax is due.
  let step = 1000;
  if (magnitude >= 1e6) {
    step = 10000;
  } else if (magnitude < 1000) {
    step = 10;
  } else if (magnitude < 10000) {
    step = 100;
  }
  return formatEuro(Math.floor(value / step) * step);
};

// Fees come from the API as fractions; the sliders and copy speak percent with two
// decimals. 0.0157 * 100 is 1.5699999999999998 in binary floating point, so
// scale-then-round instead of a bare * 100.
const toPercent = (fraction: number): number => Math.round(fraction * 10000) / 100;

// Fees are a drag on the return, so show them as a negative percent (dot decimal,
// the app's style; real minus sign). Two decimals so the width stays fixed while
// dragging ("−0.28%", "−1.00%"); an exact zero is just "0%", not a drag at all.
const formatFeePercent = (value: number): string => (value === 0 ? '0%' : `−${value.toFixed(2)}%`);

const signedPercent = (value: number): string => {
  if (value === 0) {
    return '0%';
  }
  // Use a real minus sign (U+2212), not a hyphen, for negative returns.
  const sign = value > 0 ? '+' : '−';
  return `${sign}${Math.abs(value)}%`;
};

const pillarBalance = (sourceFunds: SourceFund[], pillar: 2 | 3): number =>
  Math.round(
    sourceFunds
      .filter((fund) => fund.pillar === pillar)
      .reduce((sum, fund) => sum + fund.price + fund.unavailablePrice, 0),
  );

// Draws the dashed vertical marker lines: "you are here" between the recorded past
// and the projection, and "you retire here". Chart.js has no annotation support
// without the plugin package, and two vertical lines do not justify a dependency.
const markerLinesPlugin = (indexesRef: { current: number[] }): Plugin<'line'> => ({
  id: 'markerLines',
  afterDatasetsDraw(chart) {
    const { top, bottom } = chart.chartArea ?? {};
    if (top === undefined || bottom === undefined) {
      return;
    }
    indexesRef.current.forEach((index) => {
      const x = chart.scales.x?.getPixelForValue(index);
      if (x === undefined) {
        return;
      }
      const { ctx } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLOR_MARKER_LINE;
      ctx.lineWidth = 1;
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.restore();
    });
  },
});

const Slider: React.FC<{
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
  min: number;
  max: number;
  step: number;
  current: number;
  /** What the readout says, spoken as-is. Without it a range input announces a
   *  bare number and the euro sign or percent beside it is never read out. */
  valueText: string;
  disabled?: boolean;
  /** An anchor value marked with an arrow under the track; clicking it selects it. */
  marker?: { at: number; title: string };
  onChange: (value: number) => void;
}> = ({ id, label, value, min, max, step, current, valueText, disabled, marker, onChange }) => {
  const input = (
    <input
      id={id}
      type="range"
      className="form-range"
      min={min}
      max={max}
      step={step}
      value={current}
      aria-labelledby={`${id}-label`}
      aria-valuetext={valueText}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
  return (
    <div>
      <div className="d-flex justify-content-between align-items-baseline gap-2">
        <label className="form-label fw-medium mb-1" id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
        <span className="fw-semibold text-primary text-nowrap" aria-hidden="true">
          {value}
        </span>
      </div>
      {marker ? (
        <div className="position-relative" style={{ paddingBottom: '0.15rem' }}>
          {input}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onChange(marker.at)}
            className="btn p-0 border-0 bg-transparent position-absolute lh-1 text-secondary"
            style={{
              // Centre on the thumb: the track travel is (100% - thumbWidth) and
              // the 1.5rem thumb adds half its width back.
              left: `calc((100% - 1.5rem) * ${(marker.at - min) / (max - min)} + 0.75rem)`,
              transform: 'translateX(-50%)',
              bottom: 0,
            }}
            title={marker.title}
          >
            ↑
          </button>
        </div>
      ) : (
        input
      )}
    </div>
  );
};

// A shared link can carry the return assumption (?return=7). The page still
// DEFAULTS to 0% — following a link that names a return is the reader's own
// choice, the same click as the historical-return link on the page.
const sharedReturn = (search: string): number => {
  const raw = new URLSearchParams(search).get('return');
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.round(parsed), RETURN_MIN), RETURN_MAX)
    : DEFAULT_RETURN_PERCENT;
};

export const PensionCalculator: React.FC = () => {
  usePageTitle('pageTitle.pensionCalculator');
  const intl = useIntl();
  const { search } = useLocation();
  const { data: user } = useMe();
  const { data: sourceFunds } = useSourceFunds();
  const { data: contributions } = useContributions();
  const { data: conversion } = useConversion();
  // Funds and transactions only refine the pre-fill (Tuleva's fees, the savings fund
  // standing order), so wait for them to settle but never hold the page hostage to
  // them: if either request fails, the calculator still opens on sensible defaults.
  const { data: funds, isLoading: fundsLoading } = useFunds();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: savingsFundBalance, isLoading: savingsFundBalanceLoading } =
    useSavingsFundBalance();
  // Only members hold member capital, so only they earn the yearly bonus and get the
  // fourth band. The request is scoped to them, so non-members never fire it.
  const isMember = user?.memberNumber != null;
  const { data: capitalRows, isLoading: capitalRowsLoading } = useCapitalRows({
    enabled: isMember,
  });
  // The dated member-capital events (bonuses, work compensation, payments) draw the
  // band's real past instead of letting it appear at today. Refines the chart only, so
  // it never holds up the seed.
  const { data: capitalEvents } = useCapitalEvents({ enabled: isMember });
  // A disabled query still reports isLoading in React Query v4 (it has no data yet), so
  // a non-member would shimmer forever if we waited on it — only members wait.
  const capitalRowsSettled = !isMember || !capitalRowsLoading;

  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  // Bands the saver has toggled off from the legend; hidden datasets drop out of the
  // stack so the rest can be read on their own.
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());

  // Today's member capital, valued conservatively: the nominal sum contributed (the 1x
  // book value, ignoring the ~1.3x fair-value premium the marketplace trades at), but
  // never above today's fair value, so a rare loss below book is not projected as a
  // gain. Every row counts, matching the total on the account page — including work
  // compensation not yet vested, since the projection assumes a lifelong membership in
  // which it does vest.
  const memberCapitalSeed = useMemo(() => {
    const rows = capitalRows ?? [];
    const contributed = rows.reduce((sum, row) => sum + row.contributions, 0);
    const fairValue = rows.reduce((sum, row) => sum + row.value, 0);
    return Math.min(contributed, fairValue);
  }, [capitalRows]);

  // The tax basis on drawdown: only the member's own capital contributions (kapitali
  // panus) are deductible. Bonuses, work compensation and market growth are all taxed.
  const ownCapitalContributions = useMemo(
    () =>
      (capitalRows ?? [])
        .filter((row) => row.type === 'CAPITAL_PAYMENT')
        .reduce((sum, row) => sum + row.contributions, 0),
    [capitalRows],
  );

  const savingsFundPayments = useMemo(
    () => selectSavingsFundPayments(funds ?? [], transactions ?? []),
    [funds, transactions],
  );

  // Withdrawals included, so the drawn past dips where money actually left.
  const savingsFundFlows = useMemo(
    () => selectSavingsFundFlows(funds ?? [], transactions ?? []),
    [funds, transactions],
  );

  // Each dated member-capital event is a payment into the band, so the history scales
  // to today's book value the same way the pillars scale to their balances.
  const memberCapitalFlows = useMemo(
    () => (capitalEvents ?? []).map((event) => ({ time: event.date, amount: event.value })),
    [capitalEvents],
  );

  const tulevaFees = useMemo(() => deriveTulevaFees(funds ?? []), [funds]);

  const feeBounds = useMemo(() => deriveFeeBounds(funds ?? []), [funds]);

  // What the saver holds in the savings fund today. `null` means no account at all,
  // `undefined` means the balance hasn't loaded (or the request failed).
  const savingsFundValue =
    savingsFundBalance === null || savingsFundBalance === undefined
      ? 0
      : Math.round(savingsFundBalance.price + savingsFundBalance.unavailablePrice);
  // What was actually paid in, net of withdrawals (subtractions come negative from
  // the API). The taxable gain in the projection is the balance beyond this.
  const savingsFundBasis =
    savingsFundBalance === null || savingsFundBalance === undefined
      ? 0
      : Math.max(0, Math.round(savingsFundBalance.contributions + savingsFundBalance.subtractions));

  useEffect(() => {
    // Inputs are seeded once, so wait for the funds and transactions to settle first.
    // A failed request settles too, and then we seed from what we do have rather than
    // shimmering forever.
    if (
      inputs === null &&
      user &&
      sourceFunds &&
      contributions &&
      conversion &&
      !fundsLoading &&
      !transactionsLoading &&
      !savingsFundBalanceLoading &&
      capitalRowsSettled
    ) {
      const now = new Date();
      // The register's retirement age is the statutory floor, established only two
      // years ahead. For young savers the life-expectancy link will have raised it
      // well past 65 by the time they get there, so start the slider from the
      // higher of the register's age and our projection for their birth year —
      // kept inside the slider's paindlik pension window.
      const statutoryAge = user.retirementAge || RETIREMENT_AGE_DEFAULT;
      const birthYear = new Date(user.dateOfBirth).getFullYear();
      const retirementAge = Math.min(
        Math.max(
          statutoryAge,
          Number.isFinite(birthYear) ? projectedRetirementAge(birthYear) : statutoryAge,
        ),
        statutoryAge + PAINDLIK_PENSION_YEARS,
      );
      setInputs({
        currentAge: user.age,
        retirementAge,
        grossSalaryMonthly: deriveGrossSalary(contributions, now) ?? DEFAULT_GROSS_SALARY,
        // 0 = no II contribution (the saver has left the funded II pillar). A pending
        // rate change beats the current rate: it is what will be paid going forward.
        secondPillarRate: user.secondPillarActive
          ? user.secondPillarPaymentRates?.pending ?? user.secondPillarPaymentRates?.current ?? 2
          : 0,
        secondPillarBalance: pillarBalance(sourceFunds, 2),
        // Capped at the tax-advantaged ceiling — the slider never exceeds it either.
        thirdPillarMonthly: Math.min(
          deriveThirdPillarMonthly(contributions, now),
          thirdPillarTaxCapMonthly(deriveGrossSalary(contributions, now) ?? DEFAULT_GROSS_SALARY),
        ),
        thirdPillarBalance: pillarBalance(sourceFunds, 3),
        // Only unit holders get the slider, so only they get a prefill: projecting a
        // standing order behind a hidden control would bake in money the saver can
        // neither see nor turn off (e.g. after emptying the account).
        savingsFundMonthly:
          savingsFundValue > 0
            ? Math.min(deriveSavingsFundMonthly(savingsFundPayments, now), SAVINGS_FUND_MAX_MONTHLY)
            : 0,
        savingsFundBalance: savingsFundValue,
        savingsFundBasis,
        // A number (even 0) marks a member and turns on the band; undefined leaves a
        // non-member with the same three-pillar chart as before.
        memberCapitalBalance: isMember ? memberCapitalSeed : undefined,
        memberCapitalBasis: isMember ? ownCapitalContributions : undefined,
        annualReturnPercent: sharedReturn(search),
        // The saver's current weighted-average fund fee, so the projection reflects
        // what they actually pay today.
        feePercent: Math.min(Math.max(toPercent(conversion.weightedAverageFee), 0), feeBounds.max),
        savingsFundFeePercent: toPercent(tulevaFees.savingsFund),
        // The default payout IS the tax-free bar: your projected remaining years at
        // the age you start — the standard fondipension setup.
        withdrawalYears: projectedRemainingYears(retirementAge, retirementAge - user.age),
        payoutStrategy: 'fixedPeriod',
        inflationPercent: DEFAULT_INFLATION_PERCENT,
        todaysMoney: true,
      });
    }
  }, [
    inputs,
    user,
    sourceFunds,
    contributions,
    conversion,
    fundsLoading,
    transactionsLoading,
    savingsFundBalanceLoading,
    capitalRowsSettled,
    isMember,
    memberCapitalSeed,
    ownCapitalContributions,
    savingsFundValue,
    savingsFundBasis,
    savingsFundPayments,
    tulevaFees,
    feeBounds,
    search,
  ]);

  // The III contribution is capped by the salary for calculation without mutating
  // state, so lowering then raising the salary restores it instead of ratcheting down.
  // A band toggled off the legend is dropped from the numbers too, not just the chart:
  // its balance and contributions are zeroed, so the projection answers "what if I did
  // not have this?" and every stat below recomputes to match.
  const effectiveInputs = useMemo(() => {
    if (!inputs) {
      return null;
    }
    let next = inputs;
    if (hiddenKeys.has('secondPillar')) {
      next = { ...next, secondPillarBalance: 0, secondPillarRate: 0 };
    }
    if (hiddenKeys.has('thirdPillar')) {
      next = { ...next, thirdPillarBalance: 0, thirdPillarMonthly: 0 };
    }
    if (hiddenKeys.has('savingsFund')) {
      next = { ...next, savingsFundBalance: 0, savingsFundMonthly: 0, savingsFundBasis: 0 };
    }
    if (hiddenKeys.has('memberCapital')) {
      next = { ...next, memberCapitalBalance: undefined };
    }
    return next;
  }, [inputs, hiddenKeys]);

  const result = useMemo(
    () =>
      effectiveInputs
        ? project({
            ...effectiveInputs,
            thirdPillarMonthly: Math.min(
              effectiveInputs.thirdPillarMonthly,
              thirdPillarTaxCapMonthly(effectiveInputs.grossSalaryMonthly),
            ),
          })
        : null,
    [effectiveInputs],
  );

  // The saver's recorded past, from their first contribution to last year, so the
  // chart spans the whole saving life rather than starting today. Shown as it was
  // (nominal euros of its time), whichever way the future is restated.
  const history = useMemo(
    () =>
      effectiveInputs && contributions
        ? buildHistory(
            {
              secondPillar: contributions.filter((contribution) => contribution.pillar === 2),
              thirdPillar: contributions.filter((contribution) => contribution.pillar === 3),
              savingsFund: savingsFundFlows,
              memberCapital: memberCapitalFlows,
            },
            // A hidden bucket's balance is zero here, so buildHistory scales it away and
            // its past disappears from the chart along with its future.
            {
              secondPillar: effectiveInputs.secondPillarBalance,
              thirdPillar: effectiveInputs.thirdPillarBalance,
              savingsFund: effectiveInputs.savingsFundBalance,
              memberCapital: effectiveInputs.memberCapitalBalance ?? 0,
            },
            effectiveInputs.currentAge,
            new Date(),
          )
        : [],
    [effectiveInputs, contributions, savingsFundFlows, memberCapitalFlows],
  );

  const timeline = useMemo(
    () => (result ? [...history, ...result.timeline] : []),
    [history, result],
  );

  // The Line component reads `plugins` once, at mount. Hand it one stable plugin
  // that reads the indexes through a ref instead, so the dashed lines keep up.
  const markerIndexesRef = useRef<number[]>([]);
  const chartPlugins = useMemo(() => [markerLinesPlugin(markerIndexesRef)], []);

  if (!inputs || !result) {
    return (
      <div className="col-12 col-lg-10 mx-auto d-flex flex-column gap-3">
        <Shimmer height={40} />
        <Shimmer height={24} />
        <Shimmer height={360} />
      </div>
    );
  }

  const update = (patch: Partial<CalculatorInputs>) =>
    setInputs((previous) => (previous ? { ...previous, ...patch } : previous));

  const toggleHiddenKey = (key: string) =>
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const todaysMoney = inputs.todaysMoney ?? true;
  const inflationPercent = inputs.inflationPercent ?? DEFAULT_INFLATION_PERCENT;
  // Retiring before today makes no sense; anchor the drawdown at today instead of
  // letting the projection collapse to nothing.
  const effectiveRetirementAge = Math.max(inputs.retirementAge, inputs.currentAge);
  const payoutStrategy = inputs.payoutStrategy ?? 'fixedPeriod';
  const renewing = payoutStrategy !== 'fixedPeriod';
  // Where the drawn payout ends: the chosen period, or the age-100 horizon under
  // a renewal strategy (the money itself does not run out there).
  const payoutEndAge = renewing
    ? SMART_PAYOUT_HORIZON_AGE
    : effectiveRetirementAge + inputs.withdrawalYears;
  // The slider covers the paindlik pension window around the STATUTORY age from the
  // register — the projected prefill starts inside it, the bounds don't move with it.
  // A saver already older than the window's top still gets a slider that can reach
  // their own age, where the drawdown actually starts.
  const statutoryRetirementAge = user?.retirementAge || RETIREMENT_AGE_DEFAULT;
  const retirementAgeMin = statutoryRetirementAge - PAINDLIK_PENSION_YEARS;
  const retirementAgeMax = Math.max(
    statutoryRetirementAge + PAINDLIK_PENSION_YEARS,
    inputs.currentAge,
  );
  // The end-age track is FIXED (derived from the retirement slider's own fixed
  // bounds), so dragging the start never shifts this thumb under the cursor; the
  // 5-30 year contract bounds are enforced on change instead.
  const payoutEndMin = retirementAgeMin + WITHDRAWAL_YEARS_MIN;
  const payoutEndMax = Math.max(retirementAgeMax + WITHDRAWAL_YEARS_MAX, SMART_PAYOUT_HORIZON_AGE);

  // The slider tops out at the tax-advantaged ceiling: min(15% of gross, EUR 500)
  // a month, so it moves with the salary like the millionaire calculator's.
  const thirdPillarMax = thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly);
  const thirdPillarMonthly = Math.min(inputs.thirdPillarMonthly, thirdPillarMax);
  const retirementIndex = timeline.findIndex((point) => point.age === effectiveRetirementAge);
  // "You are here": the seam between the recorded past and the projection. With no
  // history it would sit on the y-axis, so leave it out.
  const todayIndex = history.length > 0 ? history.length : -1;
  markerIndexesRef.current = [todayIndex, retirementIndex].filter(
    (index, position, all) => index >= 0 && all.indexOf(index) === position,
  );

  // A bucket that never has money in it — past, present or future — gets no legend
  // entry: a swatch for an invisible area only raises questions. A toggled-off band has
  // no data in the effective timeline either, so it is kept explicitly, still clickable
  // to switch back on.
  const visibleLegend = PILLAR_LEGEND.filter(
    ({ key }) => hiddenKeys.has(key) || timeline.some((point) => point[key] > 0),
  );

  const chartData: ChartData<'line'> = {
    labels: timeline.map((point) => point.age),
    // One dataset per pillar, in legend order. A band toggled off from the legend is
    // hidden, dropping out of the stack so the rest can be read on their own.
    datasets: PILLAR_LEGEND.map(({ key, color, id }) => ({
      label: intl.formatMessage({ id }),
      data: timeline.map((point) => point[key]),
      borderColor: color,
      backgroundColor: color,
      fill: true,
      borderWidth: 0,
      pointRadius: 0,
      tension: 0.2,
      hidden: hiddenKeys.has(key),
    })),
  };

  // The same choices as the millionaire chart: a fast, static illustration.
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    // Fast animation so live edits feel responsive without the glitchy crawl a
    // longer duration gives when the number of points changes with age.
    animation: { duration: 200 },
    // No hover/touch interaction at all — on touch a tooltip pops up, sticks and
    // makes scrolling awkward. The headline below carries the euro figures.
    events: [],
    plugins: {
      // The globally-registered datalabels plugin stays off, or every point
      // sprouts a label.
      datalabels: { display: false },
      // No legend here — the swatch list under the chart names the colours.
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { maxTicksLimit: 6, font: { size: 12 } },
      },
      // No y-axis labels: the headline and stats carry the euro figures. Faint
      // gridlines stay for a sense of scale.
      y: {
        stacked: true,
        beginAtZero: true,
        border: { display: false },
        ticks: { display: false },
        grid: { drawTicks: false, color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  };

  return (
    <div className="pension-calculator col-12 col-lg-10 mx-auto d-flex flex-column gap-3">
      <header>
        <h1>
          <FormattedMessage id="pensionCalculator.title" />
        </h1>
        <p className="lead text-secondary mb-0">
          <FormattedMessage id="pensionCalculator.intro" />
        </p>
      </header>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-medium mb-1" htmlFor="salary">
                  <FormattedMessage id="pensionCalculator.input.salary" />
                </label>
                <CurrencyInput
                  id="salary"
                  className="mw-100"
                  value={inputs.grossSalaryMonthly}
                  max={MAX_SALARY}
                  onChange={(value) => update({ grossSalaryMonthly: value ?? 0 })}
                />
              </div>

              <div>
                <div className="form-label fw-medium mb-1" id="second-pillar-rate-label">
                  <FormattedMessage id="pensionCalculator.input.secondPillarRate" />
                </div>
                <div
                  className="btn-group w-100"
                  role="group"
                  aria-labelledby="second-pillar-rate-label"
                >
                  {SECOND_PILLAR_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`btn btn-outline-primary${
                        inputs.secondPillarRate === rate ? ' active' : ''
                      }`}
                      aria-pressed={inputs.secondPillarRate === rate}
                      onClick={() =>
                        update({ secondPillarRate: inputs.secondPillarRate === rate ? 0 : rate })
                      }
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <Slider
                id="third-pillar-monthly"
                label={<FormattedMessage id="pensionCalculator.input.thirdPillarMonthly" />}
                value={formatEuro(thirdPillarMonthly)}
                valueText={formatEuro(thirdPillarMonthly)}
                min={0}
                max={thirdPillarMax}
                step={MONTHLY_STEP}
                current={thirdPillarMonthly}
                onChange={(value) => update({ thirdPillarMonthly: value })}
              />

              {/* Only savers who already hold savings fund units get this: to anyone
                  else it would be a slider for a fund they have not opened. The amount
                  is click-to-edit, like the millionaire calculator's. */}
              {inputs.savingsFundBalance > 0 && (
                <div>
                  <div className="d-flex justify-content-between align-items-baseline gap-2">
                    <label
                      id="savings-fund-monthly-label"
                      htmlFor="savings-fund-monthly"
                      className="form-label fw-medium mb-1 text-nowrap"
                    >
                      <FormattedMessage id="pensionCalculator.input.savingsFundMonthly" />
                    </label>
                    <EditableEuro
                      className="fw-semibold text-primary text-nowrap"
                      value={inputs.savingsFundMonthly}
                      // Past the slider's cap but still four digits, so a typed amount
                      // never outgrows the display or blows up the chart.
                      max={9999}
                      ariaLabel={intl.formatMessage({
                        id: 'pensionCalculator.input.savingsFundMonthly',
                      })}
                      onCommit={(value) => update({ savingsFundMonthly: value })}
                    />
                  </div>
                  <input
                    id="savings-fund-monthly"
                    type="range"
                    className="form-range"
                    min={0}
                    max={SAVINGS_FUND_MAX_MONTHLY}
                    step={MONTHLY_STEP}
                    value={inputs.savingsFundMonthly}
                    aria-labelledby="savings-fund-monthly-label"
                    onChange={(event) => update({ savingsFundMonthly: event.target.valueAsNumber })}
                  />
                </div>
              )}

              {/* An input, not a fact from the register: paindlik pension makes the
                  stopping point the saver's own choice, five years either side of
                  the statutory age. */}
              <Slider
                id="retirement-age"
                label={<FormattedMessage id="pensionCalculator.input.retirementAge" />}
                value={
                  <FormattedMessage
                    id="pensionCalculator.years"
                    values={{ years: effectiveRetirementAge }}
                  />
                }
                valueText={intl.formatMessage(
                  { id: 'pensionCalculator.yearsSpoken' },
                  { years: effectiveRetirementAge },
                )}
                min={retirementAgeMin}
                max={retirementAgeMax}
                step={1}
                current={effectiveRetirementAge}
                // The payout slider promises an AGE, so moving the start keeps that
                // age put (within the 5-30 year contract bounds) and reshapes the
                // duration instead of dragging the end along.
                onChange={(value) =>
                  update({
                    retirementAge: value,
                    ...(renewing
                      ? {}
                      : {
                          // Only the 5-year floor binds: the track already caps the
                          // end age, so moving the start can never drag it down.
                          withdrawalYears: Math.max(payoutEndAge - value, WITHDRAWAL_YEARS_MIN),
                        }),
                  })
                }
              />

              {/* Under a renewal strategy the period is not the saver's to pick:
                  the slider stays visible but disabled, showing the real horizon. */}
              <Slider
                id="withdrawal-years"
                label={<FormattedMessage id="pensionCalculator.input.withdrawalYears" />}
                value={
                  <FormattedMessage id="pensionCalculator.years" values={{ years: payoutEndAge }} />
                }
                valueText={intl.formatMessage(
                  { id: 'pensionCalculator.yearsSpoken' },
                  { years: payoutEndAge },
                )}
                min={payoutEndMin}
                max={payoutEndMax}
                step={1}
                current={payoutEndAge}
                disabled={renewing}
                onChange={(value) =>
                  update({
                    withdrawalYears: Math.max(value - effectiveRetirementAge, WITHDRAWAL_YEARS_MIN),
                  })
                }
              />

              {/* The same return control as the millionaire calculator: an arrow marks
                  the historical 7% on the track, and the hint link jumps to it. The
                  return assumption stays on the page, never behind a toggle: a
                  calculator must not open on an automatic positive return with the
                  assumption hidden (FI/TKA teavitustegevuse juhend p 6.10.1). */}
              <div>
                <div className="d-flex justify-content-between align-items-baseline gap-1">
                  <label
                    id="return-label"
                    htmlFor="return"
                    className="form-label fw-medium mb-1 text-nowrap"
                  >
                    <FormattedMessage id="pensionCalculator.input.return" />
                  </label>
                  <span className="fw-semibold text-primary text-nowrap" aria-hidden="true">
                    {signedPercent(inputs.annualReturnPercent)}
                  </span>
                </div>
                <div className="position-relative" style={{ paddingBottom: '0.15rem' }}>
                  <input
                    id="return"
                    type="range"
                    className="form-range"
                    min={RETURN_MIN}
                    max={RETURN_MAX}
                    step={RETURN_STEP}
                    value={inputs.annualReturnPercent}
                    aria-labelledby="return-label"
                    aria-valuetext={signedPercent(inputs.annualReturnPercent)}
                    onChange={(event) =>
                      update({ annualReturnPercent: event.target.valueAsNumber })
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={() => update({ annualReturnPercent: HISTORICAL_RETURN })}
                    className="btn p-0 border-0 bg-transparent position-absolute lh-1 text-secondary"
                    style={{
                      // Centre on the thumb: the track travel is (100% - thumbWidth)
                      // and the 1.5rem thumb (this app's size) adds half its width
                      // back, so the arrow lands exactly under the thumb at 7%.
                      left: `calc((100% - 1.5rem) * ${HISTORICAL_RETURN_LEFT / 100} + 0.75rem)`,
                      transform: 'translateX(-50%)',
                      bottom: 0,
                    }}
                    title={`${HISTORICAL_RETURN}%`}
                  >
                    ↑
                  </button>
                </div>
                <p className="form-text w-100 mb-0 text-center">
                  <FormattedMessage
                    id="millionaire.input.return.hint"
                    values={{
                      a: (chunks: React.ReactNode) => (
                        <button
                          type="button"
                          onClick={() => update({ annualReturnPercent: HISTORICAL_RETURN })}
                          className="btn btn-link p-0 border-0 align-baseline"
                          style={{ fontSize: 'inherit', verticalAlign: 'baseline' }}
                        >
                          {chunks}
                        </button>
                      ),
                    }}
                  />
                </p>
              </div>

              <Slider
                id="fee"
                label={<FormattedMessage id="pensionCalculator.input.fee" />}
                value={formatFeePercent(inputs.feePercent)}
                valueText={formatFeePercent(inputs.feePercent)}
                // Down to zero, not to today's cheapest fund: fees have only ever
                // fallen, and a projection may assume they keep falling.
                min={0}
                max={feeBounds.max}
                step={FEE_STEP}
                current={inputs.feePercent}
                onChange={(value) => update({ feePercent: value })}
              />

              <div>
                <Slider
                  id="inflation"
                  label={<FormattedMessage id="pensionCalculator.input.inflation" />}
                  value={`${inflationPercent}%`}
                  valueText={`${inflationPercent}%`}
                  min={0}
                  max={INFLATION_MAX}
                  step={INFLATION_STEP}
                  current={inflationPercent}
                  // The ECB's target, anchoring the slider the way the historical
                  // return anchors its own.
                  marker={{ at: DEFAULT_INFLATION_PERCENT, title: `${DEFAULT_INFLATION_PERCENT}%` }}
                  onChange={(value) => update({ inflationPercent: value })}
                />
                <p className="form-text w-100 mb-0 text-center">
                  <FormattedMessage
                    id="pensionCalculator.input.inflation.hint"
                    values={{
                      a: (chunks: React.ReactNode) => (
                        <button
                          type="button"
                          onClick={() => update({ inflationPercent: DEFAULT_INFLATION_PERCENT })}
                          className="btn btn-link p-0 border-0 align-baseline"
                          style={{ fontSize: 'inherit', verticalAlign: 'baseline' }}
                        >
                          {chunks}
                        </button>
                      ),
                    }}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <h2 className="h5 mb-0">
                  <FormattedMessage id="pensionCalculator.results.heading" />
                </h2>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="todays-money"
                    checked={todaysMoney}
                    onChange={(event) => update({ todaysMoney: event.target.checked })}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="todays-money">
                    <FormattedMessage id="pensionCalculator.todaysMoney" />
                  </label>
                </div>
              </div>

              {/* The assumption stays ABOVE the chart, in plain sight and at full
                  strength: the mandatory 0% starting return is unrealistically grim,
                  and seeing a bold "0%" next to the picture is what nudges the saver
                  to go and move the slider. */}
              <p className="mb-0" data-testid="return-warning">
                <FormattedMessage
                  id="pensionCalculator.results.assumption"
                  values={{
                    // A string, so the number keeps its dot decimals in both locales.
                    return: String(inputs.annualReturnPercent),
                    b: (chunks: React.ReactNode) => <b>{chunks}</b>,
                  }}
                />{' '}
                {/* The nudge's call to action — only for the untouched 0% default.
                    Anyone who has already picked their own return is done choosing. */}
                {inputs.annualReturnPercent === 0 && (
                  <button
                    type="button"
                    onClick={() => update({ annualReturnPercent: HISTORICAL_RETURN })}
                    className="btn btn-link p-0 border-0 align-baseline"
                    style={{ fontSize: 'inherit', verticalAlign: 'baseline' }}
                  >
                    <FormattedMessage id="pensionCalculator.results.pickHistoricalReturn" />
                  </button>
                )}
              </p>

              <p className="visually-hidden" data-testid="chart-alt">
                <FormattedMessage
                  id="pensionCalculator.chart.description"
                  values={{
                    from: timeline[0].age,
                    peakAge: effectiveRetirementAge,
                    peak: roundedEuro(result.potAtRetirement.total),
                    to: payoutEndAge,
                    second: roundedEuro(result.potAtRetirement.secondPillar),
                    third: roundedEuro(result.potAtRetirement.thirdPillar),
                    savings: roundedEuro(result.potAtRetirement.savingsFund),
                  }}
                />
                {/* Name the member-capital share of the pot for a screen reader, since
                    the visible breakdown lists only the three pillars. */}
                {visibleLegend.some(({ key }) => key === 'memberCapital') && (
                  <>
                    {' '}
                    <FormattedMessage
                      id="pensionCalculator.chart.description.memberCapital"
                      values={{ memberCapital: roundedEuro(result.potAtRetirement.memberCapital) }}
                    />
                  </>
                )}
              </p>
              <div
                className="pension-calculator-chart"
                role="img"
                aria-label={intl.formatMessage({ id: 'pensionCalculator.chart.label' })}
              >
                <Line data={chartData} options={chartOptions} plugins={chartPlugins} />
              </div>

              {/* Clickable legend: each entry toggles its band off the stack, driving
                  Chart.js's own dataset visibility (the `hidden` flag) from a custom
                  HTML legend, as the library recommends when the canvas legend is off. */}
              <ul className="list-unstyled d-flex flex-wrap gap-3 mb-0 small">
                {visibleLegend.map(({ key, color, id }) => {
                  const isHidden = hiddenKeys.has(key);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className="pension-calculator-legend-item d-flex align-items-center gap-2 p-0 border-0 bg-transparent text-body"
                        aria-pressed={!isHidden}
                        onClick={() => toggleHiddenKey(key)}
                      >
                        <span
                          className="pension-calculator-swatch"
                          style={{ backgroundColor: color, opacity: isHidden ? 0.3 : 1 }}
                        />
                        <span
                          className={isHidden ? 'text-decoration-line-through text-secondary' : ''}
                        >
                          <FormattedMessage id={id} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* The whole pot at retirement, member capital included since it is now
                  drawn down with everything else. */}
              <p className="fs-5 mb-0" data-testid="headline">
                <FormattedMessage
                  id="pensionCalculator.results.headline"
                  values={{
                    pot: roundedEuro(result.potAtRetirement.total),
                    age: effectiveRetirementAge,
                    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                  }}
                />
              </p>

              <hr className="my-1" />

              <dl className="row row-cols-2 g-3 mb-0">
                <div className="col">
                  <dt className="small text-secondary fw-normal">
                    <FormattedMessage
                      id="pensionCalculator.stat.firstPayment"
                      values={{ age: effectiveRetirementAge }}
                    />
                  </dt>
                  <dd className="fs-5 fw-semibold mb-0" data-testid="first-payment">
                    {roundedEuro(result.firstPayment.net)}
                  </dd>
                </div>
                {/* Under a renewal strategy the last payment at the age-100 horizon
                    samples each strategy at its least representative point (the max
                    pension has spent its pot by then, on purpose); the average tells
                    the honest story. A fixed-period contract keeps its real last
                    payment, where the growth to ~3x the first is the story. */}
                {renewing ? (
                  <div className="col">
                    <dt className="small text-secondary fw-normal">
                      <FormattedMessage
                        id="pensionCalculator.stat.averagePayment"
                        values={{ from: effectiveRetirementAge, to: payoutEndAge }}
                      />
                    </dt>
                    <dd className="fs-5 fw-semibold mb-0" data-testid="average-payment">
                      {roundedEuro(result.averageNetPayment)}
                    </dd>
                  </div>
                ) : (
                  <div className="col">
                    <dt className="small text-secondary fw-normal">
                      <FormattedMessage
                        id="pensionCalculator.stat.lastPayment"
                        values={{ age: payoutEndAge }}
                      />
                    </dt>
                    <dd className="fs-5 fw-semibold mb-0" data-testid="last-payment">
                      {roundedEuro(result.lastPayment.net)}
                    </dd>
                  </div>
                )}
                {/* Always visible, whatever the strategy: a classic contract's honest
                    0 EUR next to a renewal strategy's millions is the whole story. */}
                <div className="col">
                  <dt className="small text-secondary fw-normal">
                    <FormattedMessage
                      id="pensionCalculator.stat.inheritance"
                      values={{ age: payoutEndAge }}
                    />
                  </dt>
                  <dd className="fs-5 fw-semibold mb-0" data-testid="inheritance">
                    {roundedEuro(timeline[timeline.length - 1]?.total ?? 0)}
                  </dd>
                </div>
                <div className="col">
                  <dt className="small text-secondary fw-normal">
                    <FormattedMessage id="pensionCalculator.stat.totalTax" />
                  </dt>
                  {/* Green when the pension tax is zero — the fund pension is taken tax
                      free, the smallest possible bill (any savings-fund tax is owed
                      whatever the period). Red only when a short period adds avoidable
                      10% tax, since that is the one part the slider controls. */}
                  <dd
                    className={`fs-5 fw-semibold mb-0 ${
                      result.pensionTax > 0 ? 'text-danger' : 'text-success'
                    }`}
                    data-testid="total-tax"
                    data-tip
                    data-for="total-tax-tooltip"
                    style={{ cursor: 'help' }}
                    aria-live="polite"
                  >
                    {result.totalTax > 0 ? roundedEuro(-result.totalTax) : roundedEuro(0)}
                  </dd>
                  {/* Tooltip content kept OUTSIDE the dd, so the stat's text stays just
                      the number for anything reading it. */}
                  <InfoTooltip name="total-tax-tooltip" noTrigger place="top">
                    <FormattedMessage
                      id="pensionCalculator.stat.totalTax.tooltip"
                      values={{ recommended: result.recommendedYears }}
                    />
                  </InfoTooltip>
                </div>
              </dl>
            </div>
          </div>

          {/* Experimental payout strategies, parked under the card while we test
              them: sign a new contract every year instead of once. Mutually
              exclusive ways of picking the yearly period. */}
          {/* The switches themselves are full size, same as the today's-money one;
              only the words around them are small and muted. */}
          <div className="mt-3 d-flex flex-column gap-2">
            <div className="form-text m-0">
              <FormattedMessage id="pensionCalculator.strategy.intro" />
            </div>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="strategy-four-percent"
                checked={payoutStrategy === 'fourPercentRule'}
                onChange={(event) =>
                  update({
                    payoutStrategy: event.target.checked ? 'fourPercentRule' : 'fixedPeriod',
                  })
                }
              />
              <label
                className="form-check-label small text-secondary"
                htmlFor="strategy-four-percent"
              >
                <FormattedMessage id="pensionCalculator.strategy.fourPercent" />
              </label>
              <div className="form-text m-0">
                <FormattedMessage id="pensionCalculator.strategy.fourPercent.how" />
              </div>
            </div>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="strategy-max-payout"
                checked={payoutStrategy === 'maxUtility'}
                onChange={(event) =>
                  update({ payoutStrategy: event.target.checked ? 'maxUtility' : 'fixedPeriod' })
                }
              />
              <label
                className="form-check-label small text-secondary"
                htmlFor="strategy-max-payout"
              >
                <FormattedMessage id="pensionCalculator.strategy.maxPayout" />
              </label>
              <div className="form-text m-0">
                <FormattedMessage id="pensionCalculator.strategy.maxPayout.how" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet documentation, not a section of its own: plain gray paragraphs in the
          disclaimer's voice, each led by its topic word. */}
      <div className="form-text m-0">
        {HOW_IT_WORKS.map(({ heading, body }) => (
          <p className="mb-2" key={heading}>
            <span className="fw-medium">
              <FormattedMessage id={heading} />
            </span>
            {': '}
            <FormattedMessage id={body} values={{ recommended: result.recommendedYears }} />
          </p>
        ))}
        {/* Members only, kept down here with the other footnotes so the chart card
            stays the same height as the input card beside it. */}
        {visibleLegend.some(({ key }) => key === 'memberCapital') && (
          <p className="mb-2" data-testid="member-capital-note">
            <span className="fw-medium">
              <FormattedMessage id="pensionCalculator.pillar.memberCapital" />
            </span>
            {': '}
            <FormattedMessage
              id="pensionCalculator.memberCapital.note"
              values={{ bonus: String(MEMBERSHIP_BONUS_RATE * 100) }}
            />
          </p>
        )}
      </div>

      {/* Mandatory for a fund communication: who provides the service, where the
          prospectus and key information are, the invitation to read the terms and
          take advice, and the tax-changes-over-time clause. ReklS para 3 lg 2 and
          para 29 lg 2, IFS para 80 lg 4, and the Tuleva teavitustegevuste eeskiri
          p 7 and p 8. */}
      <div className="form-text" data-testid="disclaimer">
        <FormattedMessage
          id="pensionCalculator.provider"
          values={{
            p: (chunks: React.ReactNode) => <p className="mb-2">{chunks}</p>,
            // Dark like the page footer's links, so the muted block stays muted.
            a: (chunks: React.ReactNode) => (
              <a className="text-body-secondary" href="https://tuleva.ee">
                {chunks}
              </a>
            ),
            mail: (chunks: React.ReactNode) => (
              <a className="text-body-secondary" href="mailto:tuleva@tuleva.ee">
                {chunks}
              </a>
            ),
            tel: (chunks: React.ReactNode) => (
              <a className="text-body-secondary" href="tel:+3726445100">
                {chunks}
              </a>
            ),
          }}
        />
        <FormattedMessage
          id="pensionCalculator.disclaimer"
          values={{
            recommended: result.recommendedYears,
            p: (chunks: React.ReactNode) => <p className="mb-2">{chunks}</p>,
          }}
        />
      </div>
    </div>
  );
};
