import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScriptableContext,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { createTrackedEvent } from '../common/api';
import { getCurrentPath } from '../account/ComparisonCalculator/utility';
import './MillionaireCalculator.scss';
import {
  useContributions,
  useConversion,
  useFunds,
  useMe,
  useSavingsFundBalance,
  useSavingsFundOnboardingStatus,
  useSourceFunds,
  useTransactions,
} from '../common/apiHooks';
import { CurrencyInput } from '../common/input/CurrencyInput';
import { Shimmer } from '../common/shimmer/Shimmer';
import { formatAmountForCurrency } from '../common/utils';
import { Conversion, Fund } from '../common/apiModels';
import { TranslationKey } from '../translations';
import {
  buildComparison,
  CalculatorInputs,
  thirdPillarTaxCapMonthly,
  TULEVA_FEE,
} from './calculation';
import {
  contributesMonthlyToThirdPillar,
  derivePrefill,
  deriveSavingsFundMonthly,
  latestThirdPillarMonthlyAmount,
} from './prefill';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const COLOR_TODAY = '#006ce6'; // Tuleva blue — "current course"
const COLOR_LAURA = '#008300'; // Tuleva green — "Tuleva's recipe"

const SECOND_PILLAR_RATES = [2, 4, 6];
const RETURN_MIN = -10;
const RETURN_MAX = 10;
const RETURN_STEP = 1;
const HISTORICAL_RETURN = 7; // long-run historical stock return, marked on the slider
const HISTORICAL_RETURN_LEFT = ((HISTORICAL_RETURN - RETURN_MIN) / (RETURN_MAX - RETURN_MIN)) * 100;
// Fallbacks used until /v1/funds loads; the live min/max come from that list, so we
// never hand-maintain the cheapest/priciest Estonian pension fund fees.
const FEE_MIN_FALLBACK = 0.27;
const FEE_MAX_FALLBACK = 1.57;
const FEE_STEP = 0.01;
const THIRD_PILLAR_STEP = 10;
// The savings fund has no tax ceiling to cap the slider, so pick a range wide enough to
// explore with, and the same 10 € step as the III pillar.
const SAVINGS_FUND_MAX_MONTHLY = 1000;
const SAVINGS_FUND_STEP = 10;
const GAP_COPY_THRESHOLD = 1000;
const MAX_SALARY = 100000;
const INCOME_TAX_RATE = 0.22; // III pillar contributions are refunded at the income-tax rate

// Estonian omits the thousands separator below 10 000 (e.g. "6000", but "10 000").
const formatEuro = (value: number): string => {
  const formatted = formatAmountForCurrency(value, 0);
  return Math.abs(value) < 10000 ? formatted.replace(/(\d)\u00A0(\d)/g, '$1$2') : formatted;
};

// The projection is illustrative, so exact euros would be false precision.
// Floor (never round up, to stay conservative) to the nearest 1000 up to a
// million, and to the nearest 100k above it.
const roundedEuro = (value: number): string => {
  const step = Math.abs(value) >= 1e6 ? 100000 : 1000;
  return formatEuro(Math.floor(value / step) * step);
};

// Fees are a drag on the return, so show them as a negative percent (dot decimal,
// the app's style; real minus sign). Always two decimals so the width stays fixed
// and the value doesn't flicker while dragging: "−0.28%", "−1.00%".
const formatFeePercent = (value: number): string =>
  value === 0 ? '0.00%' : `−${value.toFixed(2)}%`;

const signedPercent = (value: number): string => {
  if (value === 0) {
    return '0%';
  }
  // Use a real minus sign (U+2212), not a hyphen, for negative returns.
  const sign = value > 0 ? '+' : '−';
  return `${sign}${Math.abs(value)}%`;
};

// Vertical top-heavy fade of a colour, for the area fills under/between the lines.
const areaGradient =
  (r: number, g: number, b: number) =>
  (context: ScriptableContext<'line'>): CanvasGradient | string => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) {
      return `rgba(${r}, ${g}, ${b}, 0.12)`;
    }
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.03)`);
    return gradient;
  };

// Green band between the lines is the gain from Tuleva's recipe; blue below the
// current-course line is what today's choices already build.
const tulevaGradient = areaGradient(0, 131, 0); // #008300
const todayGradient = areaGradient(0, 108, 230); // #006ce6

// A single dot at the end of each line (the projected value at retirement).
const endPointOnly = (context: ScriptableContext<'line'>) =>
  context.dataIndex === context.dataset.data.length - 1 ? 4 : 0;

const legendDot = (color: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color,
  flexShrink: 0,
  display: 'inline-block',
});

// Right-align the summary amounts with tabular (fixed-width) figures so, e.g.,
// "1 000 000 €" and "800 000 €" line up by place value like an Excel column.
const amountCellStyle: React.CSSProperties = {
  justifySelf: 'end',
  fontVariantNumeric: 'tabular-nums',
};

// Status icons: a filled green check for a completed step and its empty twin, a
// gray circle outline (an unchecked checkbox), for a step still to take.
const successIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="flex-shrink-0"
    aria-hidden
  >
    <path
      clipRule="evenodd"
      fillRule="evenodd"
      fill="#00a100"
      d="m1 12c0-6.07513 4.92487-11 11-11 6.0751 0 11 4.92487 11 11 0 6.0751-4.9249 11-11 11-6.07513 0-11-4.9249-11-11z"
    />
    <path
      clipRule="evenodd"
      fillRule="evenodd"
      fill="#fff"
      d="m17.2071 8.29289c.3905.39053.3905 1.02369 0 1.41422l-6 5.99999c-.3905.3905-1.0237.3905-1.41421 0l-3-3c-.39052-.3905-.39052-1.0237 0-1.4142.39053-.3905 1.02369-.3905 1.41422 0l2.29289 2.2929 5.2929-5.29291c.3905-.39052 1.0237-.39052 1.4142 0z"
    />
  </svg>
);

const todoIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="flex-shrink-0"
    aria-hidden
  >
    <path
      fill="#fff"
      fillRule="evenodd"
      clipRule="evenodd"
      stroke="#adb5bd"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Z"
    />
  </svg>
);

type CtaItem = {
  id: string;
  done: boolean;
  // The step's bold title, and the state-dependent body line beneath it.
  headingKey: TranslationKey;
  bodyKey: TranslationKey;
  // Interpolated into the body line (tax benefits, standing-order amounts).
  values?: Record<string, string>;
  showButton: boolean;
  link: string;
  buttonKey: TranslationKey;
  primary?: boolean;
};

// This is a July-only campaign, so we deliberately nag: a saver counts as done
// only when fully converted to Tuleva — fund selected AND every unit transferred.
// Anyone with money still sitting in another fund (even a cheap one) gets nudged.
const fullyConverted = (pillar: Conversion): boolean =>
  pillar.selectionComplete && pillar.transfersComplete;

// Fire-and-forget, like ComparisonCalculator: tracking must never break a click.
// Note we do NOT preventDefault the way ComparisonCalculator does — these are
// react-router <Link>s, so navigation keeps the document alive and the in-flight
// POST completes on its own.
// `url` is deliberately the relative route, where ComparisonCalculator logs an
// absolute href: relative rows are the ones that match across local, staging and
// prod, so the analytics stay comparable between environments.
const trackClick = (target: string, data: Record<string, unknown> = {}): void => {
  createTrackedEvent('CLICK', { path: getCurrentPath(), target, ...data }).catch(() => {});
};

export function MillionaireCalculator() {
  const intl = useIntl();
  usePageTitle('pageTitle.millionaire');
  const { data: user } = useMe();
  const { data: sourceFunds } = useSourceFunds();
  const { data: contributions } = useContributions();
  const { data: conversion } = useConversion();
  // Funds and transactions only refine the pre-fill (fee bounds, savings fund standing
  // order), so wait for them to settle but never hold the page hostage to them: if
  // either request fails, the calculator still opens on sensible defaults.
  const { data: funds, isLoading: fundsLoading } = useFunds();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: savingsFundOnboarding } = useSavingsFundOnboardingStatus();
  const { data: savingsFundBalance } = useSavingsFundBalance();

  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);

  // The savings fund is the one fund outside the pillars, so money paid into it is
  // exactly the transactions against a fund with no pillar.
  const savingsFundPayments = useMemo(() => {
    const savingsFundIsins = new Set(
      (funds ?? []).filter((fund) => fund.pillar === null).map((fund) => fund.isin),
    );
    return (transactions ?? [])
      .filter((transaction) => savingsFundIsins.has(transaction.isin))
      .filter((transaction) => transaction.type !== 'SUBTRACTION')
      .map((transaction) => ({ time: transaction.time, amount: transaction.amount }));
  }, [transactions, funds]);

  // Tuleva's own fees, read from the live fund list rather than hardcoded, so the recipe
  // stays honest if Tuleva ever changes what it charges. Today every Tuleva fund is at
  // the same 0.28%; if they ever diverge, the recipe means the cheapest index fund.
  const tulevaFees = useMemo(() => {
    const tulevaFunds = (funds ?? []).filter(
      (fund) =>
        fund.status === 'ACTIVE' &&
        fund.fundManager.name === 'Tuleva' &&
        fund.ongoingChargesFigure > 0,
    );
    const cheapestOf = (candidates: Fund[]): number =>
      candidates.length
        ? Math.min(...candidates.map((fund) => fund.ongoingChargesFigure))
        : TULEVA_FEE;
    return {
      // The pillars, for Tuleva's line; and the savings fund, which is outside them.
      pension: cheapestOf(tulevaFunds.filter((fund) => fund.pillar !== null)),
      savingsFund: cheapestOf(tulevaFunds.filter((fund) => fund.pillar === null)),
    };
  }, [funds]);

  // Fee-slider bounds straight from the live pension-fund list (cheapest to priciest),
  // so the range stays correct without manual upkeep. Fees are stored as fractions.
  const feeBounds = useMemo(() => {
    const fees = (funds ?? [])
      .filter((fund) => fund.status === 'ACTIVE' && fund.ongoingChargesFigure > 0)
      // Round to a clean 2-decimal percent: 0.0157 * 100 is 1.5699999999999998 in
      // binary floating point, so scale-then-round instead of a bare * 100.
      .map((fund) => Math.round(fund.ongoingChargesFigure * 10000) / 100);
    return fees.length
      ? { min: Math.min(...fees), max: Math.max(...fees) }
      : { min: FEE_MIN_FALLBACK, max: FEE_MAX_FALLBACK };
  }, [funds]);

  // What the saver holds in the savings fund today. Unlike the pension balances this is
  // not rounded to the nearest 1000: the fund is new, so most balances are small enough
  // that rounding would swallow a real part of them. `null` means no account at all,
  // `undefined` means the balance hasn't loaded yet.
  const savingsFundValue =
    savingsFundBalance === null || savingsFundBalance === undefined
      ? 0
      : Math.round(savingsFundBalance.price + savingsFundBalance.unavailablePrice);

  useEffect(() => {
    // Inputs are seeded once, so wait for the funds and transactions to settle first:
    // they decide the fee bounds and the savings fund pre-fill. A failed request settles
    // too, and then we seed from what we do have rather than shimmering forever.
    if (
      inputs === null &&
      user &&
      sourceFunds &&
      contributions &&
      conversion &&
      !fundsLoading &&
      !transactionsLoading &&
      savingsFundBalance !== undefined
    ) {
      const now = new Date();
      const prefill = derivePrefill(user, sourceFunds, contributions, now);
      // Pre-fill the fee slider with the saver's current weighted-average fund fee
      // (stored as a fraction) so the current-course line reflects what they pay today.
      const currentFundFeePercent = Math.min(
        Math.max(conversion.weightedAverageFee * 100, feeBounds.min),
        feeBounds.max,
      );
      setInputs({
        ...prefill,
        annualReturnPercent: 0,
        currentFundFeePercent,
        initialSavingsFundBalance: savingsFundValue,
        savingsFundMonthly: Math.min(
          deriveSavingsFundMonthly(savingsFundPayments, now),
          SAVINGS_FUND_MAX_MONTHLY,
        ),
        tulevaFee: tulevaFees.pension,
        savingsFundFee: tulevaFees.savingsFund,
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
    feeBounds,
    tulevaFees,
    savingsFundBalance,
    savingsFundValue,
    savingsFundPayments,
  ]);

  const comparison = useMemo(
    () =>
      inputs
        ? buildComparison({
            ...inputs,
            currentThirdPillarMonthly: Math.min(
              inputs.currentThirdPillarMonthly,
              thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly),
            ),
          })
        : null,
    [inputs],
  );

  if (!inputs || !comparison) {
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

  const isRetired = inputs.currentAge >= inputs.retirementAge;
  const thirdPillarMax = thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly);
  // Cap the III contribution for display and calculation without mutating state,
  // so lowering then raising the salary restores it instead of ratcheting down.
  const thirdPillarMonthly = Math.min(inputs.currentThirdPillarMonthly, thirdPillarMax);
  // The most income tax you could get back from the III pillar in a year: 22% of the
  // maximum deductible contribution (min(15% of gross, 6000 €)), by their salary.
  const thirdPillarMaxRefund = formatEuro(INCOME_TAX_RATE * thirdPillarMax * 12);
  // II pillar contributions are income-tax-free too, so maxing the rate (6%) saves
  // 22% of that year's contribution in income tax.
  const secondPillarMaxTaxWin = formatEuro(
    INCOME_TAX_RATE * (Math.max(...SECOND_PILLAR_RATES) / 100) * inputs.grossSalaryMonthly * 12,
  );
  const { millionaireAge } = comparison.laura;

  // Concrete next steps toward Laura's recipe, checked off against the saver's
  // real pension state (not the calculator's editable inputs).
  //
  // Two different people have no active II pillar, and only one of them is stuck.
  // Someone who LEFT it cannot rejoin for ten years and has no II money to move, so both
  // II steps are advice they are unable to take: drop them, as the account page does, and
  // let the savings fund be their next step instead. Someone who NEVER JOINED can open a
  // II pillar right now with a fund choice, which is exactly where the first step sends
  // them. The pension register tells them apart: leaving clears the active date but the
  // account keeps the date it was opened on, so an open date means they have been in it.
  const inSecondPillar = user?.secondPillarActive ?? false;
  const everJoinedSecondPillar = Boolean(user?.secondPillarOpenDate);
  const leftSecondPillar = !inSecondPillar && everJoinedSecondPillar;
  const secondPillarRate =
    user?.secondPillarPaymentRates?.pending ?? user?.secondPillarPaymentRates?.current ?? 2;
  const secondAtTuleva = conversion ? fullyConverted(conversion.secondPillar) : false;
  const secondMaxed = secondPillarRate >= 6;
  const thirdAtTuleva = conversion ? fullyConverted(conversion.thirdPillar) : false;
  // Money arriving month after month means the standing order already exists, so
  // don't offer to set one up. If it pays less than the tax-deductible ceiling,
  // point them at the only place it can be raised: their own bank.
  const thirdMonthly = contributesMonthlyToThirdPillar(contributions ?? [], new Date());
  const thirdMonthlyAmount = latestThirdPillarMonthlyAmount(contributions ?? [], new Date());
  const thirdBelowCap = thirdMonthlyAmount < thirdPillarMax;
  // Paying in every month counts as contributing even before this year's first payment
  // lands: in January a standing order's last payments are all in the old year, and
  // year-to-date is still zero. Without this the step reads "you pay every month" under
  // an unchecked circle.
  const thirdContributing =
    thirdMonthly || (conversion ? conversion.thirdPillar.contribution.yearToDate > 0 : false);
  const thirdPillarBodyKey = (): TranslationKey => {
    if (!(thirdAtTuleva && thirdMonthly)) {
      return 'millionaire.cta.item.thirdPillarToTuleva.body';
    }
    return thirdBelowCap
      ? 'millionaire.cta.item.thirdPillarToTuleva.raise'
      : 'millionaire.cta.item.thirdPillarToTuleva.done';
  };

  const secondPillarItems: CtaItem[] = leftSecondPillar
    ? []
    : [
        {
          id: 'secondPillarToTuleva',
          done: secondAtTuleva,
          headingKey: 'millionaire.cta.item.secondPillarToTuleva.heading',
          bodyKey: secondAtTuleva
            ? 'millionaire.cta.item.secondPillarToTuleva.done'
            : 'millionaire.cta.item.secondPillarToTuleva.todo',
          showButton: !secondAtTuleva,
          link: '/2nd-pillar-flow',
          buttonKey: 'millionaire.cta.item.secondPillarToTuleva.button',
          // The whole calculator exists to move II pillars to Tuleva — the primary
          // conversion goal, so it gets the filled button.
          primary: true,
        },
        {
          id: 'raiseSecondPillar',
          done: secondMaxed,
          headingKey: 'millionaire.cta.item.raiseSecondPillar.heading',
          bodyKey: secondMaxed
            ? 'millionaire.cta.item.raiseSecondPillar.done'
            : 'millionaire.cta.item.raiseSecondPillar.todo',
          values: { amount: secondPillarMaxTaxWin },
          showButton: !secondMaxed,
          link: '/2nd-pillar-payment-rate',
          buttonKey: 'millionaire.cta.item.raiseSecondPillar.button',
        },
      ];

  const pillarItems: CtaItem[] = conversion
    ? [
        ...secondPillarItems,
        {
          id: 'thirdPillarToTuleva',
          done: thirdAtTuleva && thirdContributing,
          headingKey: 'millionaire.cta.item.thirdPillarToTuleva.heading',
          bodyKey: thirdPillarBodyKey(),
          values: { amount: thirdPillarMaxRefund, target: formatEuro(thirdPillarMax) },
          // A saver already paying in every month has the standing order, and it can
          // only be changed in their own bank, so there is nothing to click here.
          // Anyone else is nudged to set one up (or to open a III pillar first).
          showButton: !(thirdAtTuleva && thirdMonthly),
          link: thirdAtTuleva ? '/3rd-pillar-payment?type=RECURRING' : '/3rd-pillar-flow',
          buttonKey: thirdAtTuleva
            ? 'millionaire.cta.item.thirdPillarToTuleva.buttonOpen'
            : 'millionaire.cta.item.thirdPillarToTuleva.buttonNew',
        },
      ]
    : [];

  // The savings fund is what comes after the pension, not instead of it: the
  // pillars carry a tax benefit it doesn't, so it only earns a row once every
  // pillar step is done and it can't compete with the II/III pillar CTAs.
  const pillarsOptimized = pillarItems.length > 0 && pillarItems.every((item) => item.done);
  const savingsFundOnboarded = savingsFundOnboarding?.status === 'COMPLETED';
  const savingsFundInvested =
    savingsFundBalance !== null &&
    savingsFundBalance !== undefined &&
    savingsFundBalance.contributions > 0 &&
    savingsFundBalance.units > 0;
  // Not joined yet: join. Joined but empty: get the first euro in. Already saving:
  // turn it into a habit, with the recurring option pre-selected on arrival.
  // Joining and depositing are the same actions the account page's status box offers, so
  // they borrow its labels rather than keeping a second copy that could drift from it.
  const savingsFundStep = (): Pick<CtaItem, 'link' | 'buttonKey'> => {
    if (!savingsFundOnboarded) {
      return {
        link: '/savings-fund/onboarding',
        buttonKey: 'savingsFund.status.startSaving.label',
      };
    }
    return savingsFundInvested
      ? {
          link: '/savings-fund/payment?type=RECURRING',
          buttonKey: 'millionaire.cta.item.savingsFund.buttonRecurring',
        }
      : {
          link: '/savings-fund/payment',
          buttonKey: 'savingsFund.status.makeDeposit.label',
        };
  };
  const ctaItems: CtaItem[] =
    pillarsOptimized && savingsFundOnboarding
      ? [
          ...pillarItems,
          {
            id: 'savingsFund',
            done: savingsFundInvested,
            headingKey: 'millionaire.cta.item.savingsFund.heading',
            bodyKey: savingsFundInvested
              ? 'millionaire.cta.item.savingsFund.done'
              : 'millionaire.cta.item.savingsFund.todo',
            showButton: true,
            ...savingsFundStep(),
          },
        ]
      : pillarItems;

  const chartData: ChartData<'line', number[], number> = {
    labels: comparison.lauraTrajectory.map((point) => point.age),
    // Current-course (blue) first so it draws ON TOP: when the two lines coincide
    // (no gain to show) blue wins, which is the honest read. Tuleva (green) sits
    // underneath and fills UP to the current-course line (index 0), so the green
    // area is exactly the extra you'd gain. The test mock reads datasets by index.
    datasets: [
      {
        label: intl.formatMessage({ id: 'millionaire.chart.today' }),
        data: comparison.todayTrajectory.map((point) => point.value),
        borderColor: COLOR_TODAY,
        backgroundColor: todayGradient,
        borderWidth: 2.5,
        pointRadius: endPointOnly,
        pointBackgroundColor: COLOR_TODAY,
        pointBorderColor: COLOR_TODAY,
        tension: 0.3,
        fill: 'origin',
      },
      {
        label: intl.formatMessage({ id: 'millionaire.chart.laura' }),
        data: comparison.lauraTrajectory.map((point) => point.value),
        borderColor: COLOR_LAURA,
        backgroundColor: tulevaGradient,
        borderWidth: 3,
        pointRadius: endPointOnly,
        pointBackgroundColor: COLOR_LAURA,
        pointBorderColor: COLOR_LAURA,
        tension: 0.3,
        fill: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    // Fast animation so live edits feel responsive without the glitchy crawl a
    // longer duration gives when the number of points changes with age.
    animation: { duration: 200 },
    // No hover/touch interaction at all — the chart is a static illustration.
    events: [],
    // Small right padding keeps the end dots off the edge; the plot otherwise
    // spans the full container width.
    layout: { padding: { top: 4, right: 6 } },
    plugins: {
      // The final values are shown in a fixed summary at the top-left of the
      // chart (see the JSX overlay), which never overlaps or clips, so the
      // globally-registered datalabels plugin stays off here.
      datalabels: { display: false },
      // No legend — the top-left summary names and colours each line.
      legend: { display: false },
      // No tooltip: on touch it pops up, sticks, overlaps the summary overlay and
      // makes mobile scrolling awkward. The overlay already shows both totals.
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 6, font: { size: 12 } },
      },
      // No Y axis labels — the end-of-line pills carry the values. Keep faint
      // gridlines for a sense of scale, like the campaign prototype.
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: { display: false },
        grid: { drawTicks: false, color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  };

  const nextStepsSection = (
    <div className="d-flex flex-column gap-3">
      <h2 className="m-0 h3">
        <FormattedMessage id="millionaire.cta.title" />
      </h2>
      {conversion ? (
        <div className="border rounded">
          {ctaItems.map((item, index) => (
            <div
              key={item.id}
              className={classNames(
                'd-flex gap-3 flex-column flex-sm-row justify-content-between align-items-sm-center px-3 py-3',
                index < ctaItems.length - 1 && 'border-bottom',
              )}
              data-testid={`cta-item-${item.id}`}
              data-done={item.done ? 'true' : 'false'}
            >
              <div className="d-flex gap-3 align-items-start">
                {item.done ? successIcon : todoIcon}
                <div className="d-flex flex-column gap-1">
                  <span className="fw-medium">
                    <FormattedMessage id={item.headingKey} />
                  </span>
                  <span className="text-secondary">
                    <FormattedMessage
                      id={item.bodyKey}
                      values={{
                        ...item.values,
                        b: (chunks: React.ReactNode) => <b>{chunks}</b>,
                      }}
                    />
                  </span>
                </div>
              </div>
              {item.showButton && (
                <div className="text-nowrap">
                  <Link
                    to={item.link}
                    className={classNames(
                      'btn w-100 w-sm-auto',
                      item.primary ? 'btn-primary' : 'btn-outline-primary',
                    )}
                    onClick={() =>
                      trackClick('millionaireCalculator.ctaButton', {
                        value: item.id,
                        url: item.link,
                      })
                    }
                  >
                    <FormattedMessage id={item.buttonKey} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Shimmer height={200} />
      )}
    </div>
  );

  return (
    <div className="col-12 col-lg-10 mx-auto d-flex flex-column gap-4">
      <div className="d-flex flex-column gap-2">
        <h1 className="m-0">
          <FormattedMessage id="millionaire.title" />
        </h1>
        <p className="m-0 lead" style={{ textWrap: 'balance' } as React.CSSProperties}>
          <FormattedMessage
            id="millionaire.intro"
            values={{ b: (chunks: React.ReactNode) => <strong>{chunks}</strong> }}
          />
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          {/* h-100 so whichever column is taller, both cards still reach the same
              baseline instead of one floating short of its column. */}
          <div className="card h-100">
            <div className="card-body d-flex flex-column gap-4">
              <div>
                <label htmlFor="millionaire-salary" className="form-label fw-medium">
                  <FormattedMessage id="millionaire.input.salary" />
                </label>
                <CurrencyInput
                  id="millionaire-salary"
                  className="mw-100"
                  value={inputs.grossSalaryMonthly}
                  onChange={(value) =>
                    update({ grossSalaryMonthly: Math.min(value ?? 0, MAX_SALARY) })
                  }
                />
              </div>

              <div>
                <span id="millionaire-rate-label" className="form-label fw-medium d-block">
                  <FormattedMessage id="millionaire.input.secondPillarRate" />
                </span>
                <div
                  className="btn-group w-100"
                  role="group"
                  aria-labelledby="millionaire-rate-label"
                >
                  {SECOND_PILLAR_RATES.map((rate) => {
                    const active = inputs.currentSecondPillarRate === rate;
                    return (
                      <button
                        key={rate}
                        type="button"
                        className={classNames(
                          'btn',
                          active ? 'btn-primary' : 'btn-outline-primary',
                        )}
                        aria-pressed={active}
                        onClick={() => {
                          const newRate = active ? 0 : rate;
                          trackClick('millionaireCalculator.setSecondPillarRate', {
                            value: newRate,
                          });
                          update({ currentSecondPillarRate: newRate });
                        }}
                      >
                        {rate}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <label
                    id="millionaire-third-label"
                    htmlFor="millionaire-third"
                    className="form-label fw-medium text-nowrap"
                  >
                    <FormattedMessage id="millionaire.input.thirdPillar" />
                  </label>
                  <span className="fw-semibold text-primary text-nowrap">
                    {formatEuro(thirdPillarMonthly)}
                  </span>
                </div>
                <input
                  id="millionaire-third"
                  type="range"
                  className="form-range"
                  min={0}
                  max={thirdPillarMax}
                  step={THIRD_PILLAR_STEP}
                  value={thirdPillarMonthly}
                  aria-labelledby="millionaire-third-label"
                  onChange={(event) =>
                    update({ currentThirdPillarMonthly: event.target.valueAsNumber })
                  }
                />
              </div>

              {/* Only savers who already hold savings fund units get this: to anyone
                  else it would be a slider for a fund they have not opened. */}
              {inputs.initialSavingsFundBalance > 0 && (
                <div>
                  <div className="d-flex justify-content-between align-items-baseline gap-2">
                    <label
                      id="millionaire-savings-fund-label"
                      htmlFor="millionaire-savings-fund"
                      className="form-label fw-medium text-nowrap"
                    >
                      <FormattedMessage id="millionaire.input.savingsFund" />
                    </label>
                    <span className="fw-semibold text-primary text-nowrap">
                      {formatEuro(inputs.savingsFundMonthly)}
                    </span>
                  </div>
                  <input
                    id="millionaire-savings-fund"
                    type="range"
                    className="form-range"
                    min={0}
                    max={SAVINGS_FUND_MAX_MONTHLY}
                    step={SAVINGS_FUND_STEP}
                    value={inputs.savingsFundMonthly}
                    aria-labelledby="millionaire-savings-fund-label"
                    onChange={(event) => update({ savingsFundMonthly: event.target.valueAsNumber })}
                  />
                </div>
              )}

              <div>
                <div className="d-flex justify-content-between align-items-baseline gap-1">
                  <label
                    id="millionaire-return-label"
                    htmlFor="millionaire-return"
                    className="form-label fw-medium text-nowrap"
                  >
                    <FormattedMessage id="millionaire.input.return" />
                  </label>
                  <span className="fw-semibold text-primary text-nowrap">
                    {signedPercent(inputs.annualReturnPercent)}
                  </span>
                </div>
                <div className="position-relative" style={{ paddingBottom: '0.15rem' }}>
                  <input
                    id="millionaire-return"
                    type="range"
                    className="form-range"
                    min={RETURN_MIN}
                    max={RETURN_MAX}
                    step={RETURN_STEP}
                    value={inputs.annualReturnPercent}
                    aria-labelledby="millionaire-return-label"
                    onChange={(event) =>
                      update({ annualReturnPercent: event.target.valueAsNumber })
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={() => {
                      trackClick('millionaireCalculator.setHistoricalReturn', {
                        value: HISTORICAL_RETURN,
                        source: 'arrow',
                      });
                      update({ annualReturnPercent: HISTORICAL_RETURN });
                    }}
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
                          onClick={() => {
                            trackClick('millionaireCalculator.setHistoricalReturn', {
                              value: HISTORICAL_RETURN,
                              source: 'hintLink',
                            });
                            update({ annualReturnPercent: HISTORICAL_RETURN });
                          }}
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

              <div>
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <label
                    id="millionaire-fee-label"
                    htmlFor="millionaire-fee"
                    className="form-label fw-medium text-nowrap"
                  >
                    <FormattedMessage id="millionaire.input.fee" />
                  </label>
                  <span className="fw-semibold text-primary text-nowrap">
                    {formatFeePercent(inputs.currentFundFeePercent)}
                  </span>
                </div>
                <input
                  id="millionaire-fee"
                  type="range"
                  className="form-range"
                  min={feeBounds.min}
                  max={feeBounds.max}
                  step={FEE_STEP}
                  value={inputs.currentFundFeePercent}
                  aria-labelledby="millionaire-fee-label"
                  onChange={(event) =>
                    update({ currentFundFeePercent: event.target.valueAsNumber })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          {isRetired ? (
            <div className="card h-100">
              <div className="card-body d-flex align-items-center justify-content-center text-center text-secondary">
                <FormattedMessage id="millionaire.alreadyRetired" />
              </div>
            </div>
          ) : (
            // One card, matching the input card's height exactly: the chart takes
            // whatever is left after the title and the verdict, however many lines the
            // verdict wraps to, so neither column ends with dead space.
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h2 className="h5 m-0 mb-3">
                  <FormattedMessage
                    id="millionaire.chart.title"
                    values={{ age: inputs.retirementAge }}
                  />
                </h2>
                <div className="millionaire-chart">
                  <Line data={chartData} options={chartOptions} />
                  <div
                    className="position-absolute rounded"
                    style={{
                      top: 4,
                      left: 4,
                      padding: '4px 10px 5px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.78)',
                      pointerEvents: 'none',
                      // Grid so the dot, label and amount line up in columns. The
                      // amounts are right-aligned with tabular figures, so they read
                      // like a column of numbers (Excel-style) whatever their length.
                      display: 'grid',
                      gridTemplateColumns: 'auto auto auto',
                      alignItems: 'center',
                      columnGap: '0.5rem',
                      rowGap: '0.25rem',
                    }}
                    data-testid="chart-summary"
                  >
                    <span style={legendDot(COLOR_LAURA)} />
                    <span className="small">
                      <FormattedMessage id="millionaire.chart.laura" />
                    </span>
                    <span className="fw-semibold" style={amountCellStyle}>
                      {roundedEuro(comparison.laura.total)}
                    </span>
                    <span style={legendDot(COLOR_TODAY)} />
                    <span className="small">
                      <FormattedMessage id="millionaire.chart.today" />
                    </span>
                    <span className="fw-semibold" style={amountCellStyle}>
                      {roundedEuro(comparison.today.total)}
                    </span>
                  </div>
                </div>

                <p className="fs-5 m-0 mt-3" role="status" data-testid="gap-message">
                  {comparison.gap > GAP_COPY_THRESHOLD ? (
                    <FormattedMessage
                      id={
                        millionaireAge !== null
                          ? 'millionaire.gap.more.withAge'
                          : 'millionaire.gap.more'
                      }
                      values={{
                        amount: roundedEuro(comparison.gap),
                        age: millionaireAge,
                        b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                      }}
                    />
                  ) : (
                    <span className="text-success fw-bold">
                      <FormattedMessage
                        id={
                          millionaireAge !== null
                            ? 'millionaire.gap.onTrack.withAge'
                            : 'millionaire.gap.onTrack'
                        }
                        values={{ age: millionaireAge }}
                      />
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past retirement age there is no projection left to draw, but the steps still
          stand: a saver at their lifetime peak balance is exactly who a high fund fee
          costs the most, they can still switch funds, and both the III pillar and the
          savings fund stay open to them. It is the chart that stops making sense, not
          the advice. */}
      {nextStepsSection}
      <div className="form-text m-0">
        <FormattedMessage
          id="millionaire.disclaimer"
          values={{
            p: (chunks: React.ReactNode) => <p className="mb-2">{chunks}</p>,
            // Gray link, matching the first-pillar note on the 2nd-pillar growth page.
            a: (chunks: React.ReactNode) => (
              <Link to="/1st-vs-2nd-pillar" className="text-secondary">
                {chunks}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}

export default MillionaireCalculator;
