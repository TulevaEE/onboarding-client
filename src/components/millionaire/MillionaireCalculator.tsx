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
import { Collapse } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { useContributions, useConversion, useMe, useSourceFunds } from '../common/apiHooks';
import { CurrencyInput } from '../common/input/CurrencyInput';
import { InfoTooltip } from '../common/infoTooltip/InfoTooltip';
import { Shimmer } from '../common/shimmer/Shimmer';
import { formatAmountForCurrency } from '../common/utils';
import { Conversion } from '../common/apiModels';
import { TranslationKey } from '../translations';
import { buildComparison, CalculatorInputs, thirdPillarTaxCapMonthly } from './calculation';
import { derivePrefill } from './prefill';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const COLOR_TODAY = '#7c93ab'; // muted grey-blue — "current course"
const COLOR_LAURA = '#006ce6'; // Tuleva blue — "Laura's recipe"

const SECOND_PILLAR_RATES = [2, 4, 6];
const RETURN_MIN = -10;
const RETURN_MAX = 10;
const RETURN_STEP = 1;
const HISTORICAL_RETURN = 7; // long-run historical stock return, marked on the slider
const HISTORICAL_RETURN_LEFT = ((HISTORICAL_RETURN - RETURN_MIN) / (RETURN_MAX - RETURN_MIN)) * 100;
const THIRD_PILLAR_STEP = 10;
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

const signedPercent = (value: number): string => {
  if (value === 0) {
    return '0%';
  }
  // Use a real minus sign (U+2212), not a hyphen, for negative returns.
  const sign = value > 0 ? '+' : '−';
  return `${sign}${Math.abs(value)}%`;
};

// Pull a slider's caption up under the track — the range element reserves
// whitespace below its thumb that otherwise leaves the caption floating.
const sliderHintStyle = { marginTop: '-0.375rem' };

// Blue vertical gradient under Laura's line, echoing the campaign prototype.
const lauraAreaGradient = (context: ScriptableContext<'line'>) => {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) {
    return 'rgba(0, 108, 230, 0.12)';
  }
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(0, 108, 230, 0.22)');
  gradient.addColorStop(1, 'rgba(0, 108, 230, 0.02)');
  return gradient;
};

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

// Status icons borrowed from the account status box: a filled green check for a
// completed step, a dashed circle with a plus for a step still to take.
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
      stroke="#00A100"
      strokeDasharray="2 3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Z"
    />
    <path stroke="#00A100" strokeLinecap="round" strokeWidth="1.5" d="M12 7v10m5-5H7" />
  </svg>
);

type CtaItem = {
  id: string;
  done: boolean;
  link: string;
  primary?: boolean;
  // Overrides the button label key when a step's action depends on state (e.g. the
  // III step reads "open a pillar" or "set up a standing order").
  labelKey?: string;
  // Interpolated into the benefit line (e.g. the salary-based yearly tax benefit).
  amount?: string;
  // Keep the CTA button visible even when the step is done (III: keep nudging more
  // contributions once the saver is already contributing).
  keepButtonWhenDone?: boolean;
};

// This is a July-only campaign, so we deliberately nag: a saver counts as done
// only when fully converted to Tuleva — fund selected AND every unit transferred.
// Anyone with money still sitting in another fund (even a cheap one) gets nudged.
const fullyConverted = (pillar: Conversion): boolean =>
  pillar.selectionComplete && pillar.transfersComplete;

export function MillionaireCalculator() {
  const intl = useIntl();
  usePageTitle('pageTitle.millionaire');
  const { data: user } = useMe();
  const { data: sourceFunds } = useSourceFunds();
  const { data: contributions } = useContributions();
  const { data: conversion } = useConversion();

  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    if (inputs === null && user && sourceFunds && contributions) {
      const prefill = derivePrefill(user, sourceFunds, contributions, new Date());
      setInputs({ ...prefill, annualReturnPercent: 0 });
    }
  }, [inputs, user, sourceFunds, contributions]);

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
  const thirdPillarYearly = formatEuro(thirdPillarMonthly * 12);
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
  // A saver who has left the funded II pillar contributes nothing, so a stale
  // stored rate must not count as "already at 6%".
  const effectiveSecondPillarRate = user?.secondPillarActive
    ? user?.secondPillarPaymentRates?.pending ?? user?.secondPillarPaymentRates?.current ?? 2
    : 0;
  const thirdAtTuleva = conversion ? fullyConverted(conversion.thirdPillar) : false;
  const thirdContributing = conversion ? conversion.thirdPillar.contribution.yearToDate > 0 : false;
  const ctaItems: CtaItem[] = conversion
    ? [
        {
          id: 'secondPillarToTuleva',
          done: fullyConverted(conversion.secondPillar),
          link: '/2nd-pillar-flow',
          // The whole calculator exists to move II pillars to Tuleva — this is the
          // primary conversion goal, so it gets the filled button.
          primary: true,
        },
        {
          id: 'raiseSecondPillar',
          done: effectiveSecondPillarRate >= 6,
          link: '/2nd-pillar-payment-rate',
          amount: secondPillarMaxTaxWin,
        },
        {
          id: 'thirdPillarToTuleva',
          // Done once at Tuleva and contributing this year; at Tuleva but not yet
          // contributing → set up a standing order; not at Tuleva → open one.
          done: thirdAtTuleva && thirdContributing,
          link: thirdAtTuleva ? '/3rd-pillar-payment?type=RECURRING' : '/3rd-pillar-flow',
          labelKey: thirdAtTuleva ? 'thirdPillarPayment' : undefined,
          amount: thirdPillarMaxRefund,
          // Even a contributing saver can grow their standing order, so keep nudging.
          keepButtonWhenDone: thirdAtTuleva,
        },
      ]
    : [];

  const chartData: ChartData<'line', number[], number> = {
    labels: comparison.lauraTrajectory.map((point) => point.age),
    // Laura first so the blue line draws on top of the grey one (visible when they
    // overlap) and Laura leads in the tooltip. The test mock reads datasets by index.
    datasets: [
      {
        label: intl.formatMessage({ id: 'millionaire.chart.laura' }),
        data: comparison.lauraTrajectory.map((point) => point.value),
        borderColor: COLOR_LAURA,
        backgroundColor: lauraAreaGradient,
        borderWidth: 3,
        pointRadius: endPointOnly,
        pointBackgroundColor: COLOR_LAURA,
        pointBorderColor: COLOR_LAURA,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: 'origin',
      },
      {
        label: intl.formatMessage({ id: 'millionaire.chart.today' }),
        data: comparison.todayTrajectory.map((point) => point.value),
        borderColor: COLOR_TODAY,
        backgroundColor: COLOR_TODAY,
        borderWidth: 2.5,
        pointRadius: endPointOnly,
        pointBackgroundColor: COLOR_TODAY,
        pointBorderColor: COLOR_TODAY,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    // Fast animation so live edits feel responsive without the glitchy crawl a
    // longer duration gives when the number of points changes with age.
    animation: { duration: 200 },
    interaction: { mode: 'index', intersect: false },
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
      tooltip: {
        // Slide (caret/position) and fade (opacity) both at 200ms with an ease-out
        // curve — chart.js defaults these to a sluggish 400ms/linear.
        animation: { duration: 200, easing: 'easeOutQuart' },
        animations: { opacity: { easing: 'easeOutQuart', duration: 200 } },
        usePointStyle: true,
        // Keep the caret centred at the bottom (tooltip above the point) instead of
        // flipping left/right as the cursor moves across the chart.
        xAlign: 'center',
        yAlign: 'bottom',
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        backgroundColor: '#fff',
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: 'rgba(0, 0, 0, 0.16)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: { top: 8, bottom: 8, left: 12, right: 12 },
        callbacks: {
          title: (items) =>
            `${intl.formatMessage({ id: 'millionaire.input.age' })} ${items[0].label}`,
          label: (item) => `${item.dataset.label}: ${roundedEuro(item.parsed.y)}`,
          labelColor: (item) => ({
            borderColor: item.dataset.borderColor as string,
            backgroundColor: item.dataset.borderColor as string,
            borderWidth: 0,
            borderRadius: 4,
          }),
          labelPointStyle: () => ({ pointStyle: 'circle' as const, rotation: 0 }),
        },
      },
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

  const breakdownSection = (
    <div>
      <button
        type="button"
        className="btn p-0 border-0 focus-ring d-flex align-items-center gap-1 fw-medium text-primary"
        onClick={() => setBreakdownOpen(!breakdownOpen)}
        aria-expanded={breakdownOpen}
        aria-controls="millionaire-breakdown"
      >
        <FormattedMessage id="millionaire.breakdown.toggle" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{
            transform: breakdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
        </svg>
      </button>
      <Collapse in={breakdownOpen}>
        <div id="millionaire-breakdown">
          <dl className="m-0 mt-3">
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="fw-normal m-0">
                <FormattedMessage id="millionaire.breakdown.lauraSecondPillar" />
              </dt>
              <dd className="m-0 fw-medium">{roundedEuro(comparison.laura.secondPillar)}</dd>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="fw-normal m-0">
                <FormattedMessage id="millionaire.breakdown.lauraThirdPillar" />
              </dt>
              <dd className="m-0 fw-medium">{roundedEuro(comparison.laura.thirdPillar)}</dd>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="fw-normal m-0">
                <FormattedMessage id="millionaire.breakdown.millionaireAge" />
              </dt>
              <dd className="m-0 fw-medium">
                {millionaireAge !== null ? (
                  <FormattedMessage
                    id="millionaire.breakdown.millionaireAgeValue"
                    values={{ age: millionaireAge }}
                  />
                ) : (
                  <FormattedMessage id="millionaire.breakdown.millionaireAgeNever" />
                )}
              </dd>
            </div>
            <div className="d-flex justify-content-between py-2">
              <dt className="fw-normal m-0">
                <FormattedMessage id="millionaire.breakdown.feeCost" />
                <InfoTooltip name="millionaire-fee-cost">
                  <FormattedMessage id="millionaire.breakdown.feeCost.info" />
                </InfoTooltip>
              </dt>
              <dd className="m-0 fw-medium text-danger">−{roundedEuro(comparison.feeCost)}</dd>
            </div>
          </dl>
          <div className="form-text mt-3 mb-0">
            <FormattedMessage
              id="millionaire.assumptions"
              values={{
                p: (chunks: React.ReactNode) => <p className="mb-2">{chunks}</p>,
              }}
            />
          </div>
        </div>
      </Collapse>
    </div>
  );

  const nextStepsSection = (
    <div className="d-flex flex-column gap-3">
      <h2 className="m-0 h5">
        <FormattedMessage id="millionaire.cta.title" />
      </h2>
      {conversion ? (
        <div className="border rounded">
          {ctaItems.map((item, index) => {
            const textId = `millionaire.cta.item.${item.id}.text` as TranslationKey;
            const buttonId = `millionaire.cta.item.${item.labelKey ?? item.id}` as TranslationKey;
            return (
              <div
                key={item.id}
                className={classNames(
                  'd-flex gap-3 flex-column flex-sm-row justify-content-between align-items-sm-center px-3',
                  index < ctaItems.length - 1 && 'border-bottom',
                )}
                // Fixed row height so a step with a CTA button and one with just a
                // checkmark are the same height.
                style={{ minHeight: '3.5rem' }}
                data-testid={`cta-item-${item.id}`}
                data-done={item.done ? 'true' : 'false'}
              >
                <div className="d-flex gap-3 align-items-center">
                  {item.done ? successIcon : todoIcon}
                  <span
                    className={
                      item.done && !item.keepButtonWhenDone ? 'text-secondary' : 'fw-medium'
                    }
                  >
                    <FormattedMessage id={textId} values={{ amount: item.amount }} />
                  </span>
                </div>
                {(!item.done || item.keepButtonWhenDone) && (
                  <div className="text-nowrap">
                    <Link
                      to={item.link}
                      className={classNames(
                        'btn',
                        item.primary ? 'btn-primary' : 'btn-outline-primary',
                      )}
                    >
                      <FormattedMessage id={buttonId} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
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
          <div className="card">
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
                        onClick={() => update({ currentSecondPillarRate: active ? 0 : rate })}
                      >
                        {rate}%
                      </button>
                    );
                  })}
                </div>
                <div className="form-text">
                  <FormattedMessage
                    id={
                      inputs.currentSecondPillarRate > 0
                        ? 'millionaire.input.secondPillarRate.hint'
                        : 'millionaire.input.secondPillarRate.hintInactive'
                    }
                  />
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
                    {formatAmountForCurrency(thirdPillarMonthly, 0)}
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
                <div className="form-text" style={sliderHintStyle}>
                  <FormattedMessage
                    id="millionaire.input.thirdPillar.perYear"
                    values={{ amount: thirdPillarYearly }}
                  />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-baseline gap-2">
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
                <p className="form-text w-100 mb-0">
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
            <div className="d-flex flex-column gap-3">
              <div className="card">
                <div className="card-body">
                  <h2 className="h5 m-0 mb-3">
                    <FormattedMessage
                      id="millionaire.chart.title"
                      values={{ age: inputs.retirementAge }}
                    />
                  </h2>
                  <div style={{ position: 'relative', height: 320 }}>
                    <Line data={chartData} options={chartOptions} />
                    <div
                      className="position-absolute rounded"
                      style={{
                        top: 4,
                        left: 4,
                        padding: '4px 10px 5px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.78)',
                        pointerEvents: 'none',
                        // Grid so the dot, label and amount line up in columns across
                        // both rows — the amounts start from the same spot regardless
                        // of the label width.
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
                      <span className="fw-semibold">{roundedEuro(comparison.laura.total)}</span>
                      <span style={legendDot(COLOR_TODAY)} />
                      <span className="small">
                        <FormattedMessage id="millionaire.chart.today" />
                      </span>
                      <span className="fw-semibold">{roundedEuro(comparison.today.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="fs-5 m-0" role="status" data-testid="gap-message">
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
                      b: (chunks: React.ReactNode) => (
                        <span className="text-success fw-bold">{chunks}</span>
                      ),
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
          )}
        </div>
      </div>

      {!isRetired && nextStepsSection}
      {!isRetired && breakdownSection}
      <p className="form-text m-0">
        <FormattedMessage id="millionaire.disclaimer" />
      </p>
    </div>
  );
}

export default MillionaireCalculator;
