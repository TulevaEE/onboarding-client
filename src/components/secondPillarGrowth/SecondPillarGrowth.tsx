import React, { useMemo, useState } from 'react';
import { Collapse } from 'react-bootstrap';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  ChartType,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  TooltipPositionerFunction,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { useMe, useSecondPillarAssets } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { formatAmountForCurrency } from '../common/utils';
import { TranslationKey } from '../translations';

declare module 'chart.js' {
  interface TooltipPositionerMap {
    segmentCenter: TooltipPositionerFunction<ChartType>;
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

Tooltip.positioners.segmentCenter = function segmentCenter(elements) {
  if (!elements.length) {
    return false;
  }
  const element = elements[0].element as BarElement;
  return element.getCenterPoint();
};

const STACKED_BAR_SEPARATOR_WIDTH = 1;
const STACKED_BAR_SEPARATOR_COLOR = '#fff';
const STACK_KEY = 'balance';
const SWATCH_SIZE = 14;

// Chart palette reuses the tax-win page's softer hues (see
// SecondPillarTaxWin.tsx) so the two 2nd-pillar charts feel
// consistent. Each segment comes from a distinct hue family.
const COLOR_CONTRIBUTION = '#7DD3FC'; // sky-300 — your contribution (bolder anchor color)
const COLOR_STATE = '#D0D5DC'; // tax-win gray — neutral state share
const COLOR_INHERITANCE = '#C4B5FD'; // pastel violet — rare inherited amount, distinct from the rest
// Growth is semantic: positive = nicer tax-win green, loss = softer red.
const COLOR_GROWTH_POSITIVE = '#A3D9AC'; // muted pastel green
const COLOR_GROWTH_NEGATIVE = '#FCA5A5'; // pastel red (Tailwind red-300)
const COLOR_WITHDRAWN = '#F3D47A'; // soft mustard — outflow

const HOVER_CONTRIBUTION = '#5FC5F8';
const HOVER_STATE = '#B5BEC8';
const HOVER_INHERITANCE = '#A692F7';
const HOVER_GROWTH_POSITIVE = '#8CC496';
const HOVER_GROWTH_NEGATIVE = '#F08785';
const HOVER_WITHDRAWN = '#DEBF66';

type AccountRow = {
  labelId: TranslationKey;
  amount: number;
  color: string;
};

type Segments = {
  contribution: number;
  state: number;
  inheritance: number;
  growth: number;
  withdrawn: number;
};

const orderedAccountRows = (segments: Segments): AccountRow[] => {
  const netWithdrawn = -segments.withdrawn;
  const growthColor = segments.growth >= 0 ? COLOR_GROWTH_POSITIVE : COLOR_GROWTH_NEGATIVE;
  const rows: AccountRow[] = [];
  // Positive segments, top-of-bar to just-above-zero (reverse of dataset order)
  if (segments.growth >= 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.growth',
      amount: segments.growth,
      color: growthColor,
    });
  }
  if (segments.inheritance > 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.inheritance',
      amount: segments.inheritance,
      color: COLOR_INHERITANCE,
    });
  }
  if (segments.state > 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.government',
      amount: segments.state,
      color: COLOR_STATE,
    });
  }
  if (segments.contribution > 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.own',
      amount: segments.contribution,
      color: COLOR_CONTRIBUTION,
    });
  }
  // Negative segments, closest-to-zero first
  if (segments.growth < 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.growth',
      amount: segments.growth,
      color: growthColor,
    });
  }
  if (netWithdrawn > 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.withdrawals',
      amount: segments.withdrawn,
      color: COLOR_WITHDRAWN,
    });
  }
  return rows;
};

const SecondPillarGrowth = () => {
  const intl = useIntl();
  usePageTitle('pageTitle.secondPillarGrowth');
  const { data: assets } = useSecondPillarAssets();
  const { data: user } = useMe();
  const currentPaymentRate = user?.secondPillarPaymentRates?.current ?? 2;

  const segments: Segments | null = useMemo(() => {
    if (!assets) {
      return null;
    }
    if (assets.insurance > assets.withdrawals) {
      throw new Error(
        `SecondPillarGrowth invariant violation: insurance receipts (${assets.insurance}) exceed withdrawals (${assets.withdrawals}). Expected insurance to be a subset of money previously withdrawn to a pensionileping.`,
      );
    }
    const contribution = assets.employeeWithheldPortion + assets.additionalParentalBenefit;
    const state =
      assets.socialTaxPortion + assets.compensation + assets.interest + assets.corrections;
    const { inheritance } = assets;
    const netWithdrawals = assets.withdrawals - assets.insurance;
    const growth = assets.balance + netWithdrawals - contribution - state - inheritance;
    const withdrawn = -netWithdrawals;
    return { contribution, state, inheritance, growth, withdrawn };
  }, [assets]);

  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const subNoteKey = useMemo(() => {
    if (!segments || !assets || assets.pikFlag) {
      return null;
    }
    const hasWithdrawals = segments.withdrawn < 0;
    const hasInsuranceReceipts = assets.insurance > 0;
    const hasNegativeReturn = segments.growth < 0;
    if (hasInsuranceReceipts) {
      return hasNegativeReturn ? 'pensionilepingUnwoundAndNegative' : 'pensionilepingUnwound';
    }
    if (hasWithdrawals && hasNegativeReturn) {
      return 'withdrawalsAndNegative';
    }
    if (hasWithdrawals) {
      return 'withdrawals';
    }
    if (hasNegativeReturn) {
      return 'negativeReturn';
    }
    if (segments.contribution === 0 && segments.state > 0) {
      return 'parentalLeave';
    }
    return null;
  }, [segments, assets]);

  const ctaContent = (() => {
    if (currentPaymentRate === 2 || currentPaymentRate === 4) {
      return (
        <>
          <h2 className="m-0 h3">
            <FormattedMessage id="secondPillarGrowth.cta.wantMoreOwnContribution" />
          </h2>
          <p className="m-0">
            <Link
              to="/2nd-pillar-payment-rate"
              className="icon-link icon-link-hover fw-medium lead"
            >
              <FormattedMessage id="secondPillarGrowth.cta.increaseContributionTo6Percent" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-arrow-right"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                />
              </svg>
            </Link>
          </p>
          <p className="m-0">
            <FormattedMessage id="secondPillarGrowth.cta.higherRateGrowsFaster" />
          </p>
        </>
      );
    }
    return (
      <>
        <h2 className="m-0 h3">
          <FormattedMessage id="secondPillarGrowth.cta.wantToSaveMore" />
        </h2>
        <p className="m-0">
          <Link to="/3rd-pillar-payment" className="icon-link icon-link-hover fw-medium lead">
            <FormattedMessage id="secondPillarGrowth.cta.makeThirdPillarContribution" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-arrow-right"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
              />
            </svg>
          </Link>
        </p>
        <p className="m-0">
          <FormattedMessage id="secondPillarGrowth.cta.thirdPillarAdditional" />
        </p>
      </>
    );
  })();

  const formatCurrency = (value: number) => formatAmountForCurrency(value, 0);

  const chartData = (() => {
    if (!segments) {
      return null;
    }

    const growthIsPositive = segments.growth >= 0;
    const rawDatasets = [
      {
        label: intl.formatMessage({ id: 'secondPillarGrowth.chart.yourContributions' }),
        value: segments.contribution,
        color: COLOR_CONTRIBUTION,
        hover: HOVER_CONTRIBUTION,
      },
      {
        label: intl.formatMessage({ id: 'secondPillarGrowth.chart.government' }),
        value: segments.state,
        color: COLOR_STATE,
        hover: HOVER_STATE,
      },
      ...(segments.inheritance > 0
        ? [
            {
              label: intl.formatMessage({ id: 'secondPillarGrowth.chart.inheritance' }),
              value: segments.inheritance,
              color: COLOR_INHERITANCE,
              hover: HOVER_INHERITANCE,
            },
          ]
        : []),
      {
        label: intl.formatMessage({ id: 'secondPillarGrowth.chart.growth' }),
        value: segments.growth,
        color: growthIsPositive ? COLOR_GROWTH_POSITIVE : COLOR_GROWTH_NEGATIVE,
        hover: growthIsPositive ? HOVER_GROWTH_POSITIVE : HOVER_GROWTH_NEGATIVE,
      },
      {
        label: intl.formatMessage({ id: 'secondPillarGrowth.chart.withdrawals' }),
        value: segments.withdrawn,
        color: COLOR_WITHDRAWN,
        hover: HOVER_WITHDRAWN,
      },
    ];

    // Top of visual stack: last dataset with a positive value.
    // Bottom of visual stack: last dataset with a negative value.
    let topPositiveIdx = -1;
    let bottomNegativeIdx = -1;
    rawDatasets.forEach((ds, i) => {
      if (ds.value > 0) {
        topPositiveIdx = i;
      }
      if (ds.value < 0) {
        bottomNegativeIdx = i;
      }
    });

    const roundedCorner = 6;

    return {
      labels: [intl.formatMessage({ id: 'secondPillarGrowth.chart.label' })],
      datasets: rawDatasets.map((ds, i) => ({
        label: ds.label,
        data: [ds.value],
        backgroundColor: ds.color,
        hoverBackgroundColor: ds.hover,
        borderColor: STACKED_BAR_SEPARATOR_COLOR,
        borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
        borderSkipped: false,
        stack: STACK_KEY,
        borderRadius: {
          topLeft: i === topPositiveIdx ? roundedCorner : 0,
          topRight: i === topPositiveIdx ? roundedCorner : 0,
          bottomLeft: i === bottomNegativeIdx ? roundedCorner : 0,
          bottomRight: i === bottomNegativeIdx ? roundedCorner : 0,
        },
      })),
    };
  })();

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    layout: { padding: { bottom: 24 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        animation: { duration: 150 },
        backgroundColor: '#fff',
        bodyColor: '#212529',
        titleColor: '#212529',
        borderColor: 'rgba(0, 0, 0, 0.16)',
        borderWidth: 1,
        cornerRadius: 8,
        caretSize: 6,
        position: 'segmentCenter' as const,
        xAlign: 'center' as const,
        yAlign: 'bottom' as const,
        usePointStyle: true,
        boxWidth: SWATCH_SIZE,
        boxHeight: SWATCH_SIZE,
        padding: { top: 12, bottom: 12, left: 16, right: 16 },
        boxPadding: 4,
        callbacks: {
          title: () => '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label(context: any) {
            const value = context.parsed?.y ?? 0;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#212529',
        clamp: true,
        font: {
          family: '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          size: 16,
          lineHeight: 1.25,
          weight: 'bold' as const,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter(_value: number, context: any) {
          const { datasets } = context.chart.data;
          let topPositiveIndex = -1;
          datasets.forEach((ds: { data: number[] }, i: number) => {
            if ((ds.data[context.dataIndex] ?? 0) > 0) {
              topPositiveIndex = i;
            }
          });
          if (context.datasetIndex !== topPositiveIndex) {
            return '';
          }
          const total = datasets.reduce(
            (acc: number, ds: { data: number[] }) => acc + (ds.data[context.dataIndex] ?? 0),
            0,
          );
          return formatCurrency(total);
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        max: segments
          ? (segments.contribution +
              segments.state +
              Math.max(segments.growth, 0) +
              segments.inheritance) *
            1.2
          : undefined,
        min: segments ? (Math.min(0, segments.growth) + Math.min(0, segments.withdrawn)) * 1.05 : 0,
        ticks: { display: false },
        border: { display: false },
        grid: {
          display: true,
          drawTicks: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (ctx: any) => (ctx.tick?.value === 0 ? 'rgba(0, 0, 0, 0.175)' : 'rgba(0,0,0,0)'),
          lineWidth: 1,
        },
      },
    },
  };

  const renderAccountRow = (labelId: TranslationKey, amount: number, swatchColor: string) => {
    const rowId = labelId.replace(/\./g, '-');
    return (
      <div
        key={labelId}
        className="d-flex justify-content-between align-items-center gap-2 py-2 border-bottom"
      >
        <dt
          id={rowId}
          className="d-flex align-items-center gap-2 m-0 fw-normal"
          style={{ minWidth: 0 }}
        >
          <span
            className="flex-shrink-0"
            aria-hidden
            style={{
              display: 'inline-block',
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              borderRadius: '50%',
              backgroundColor: swatchColor,
            }}
          />
          <span className="text-truncate">
            <FormattedMessage id={labelId} />
          </span>
        </dt>
        <dd aria-labelledby={rowId} className="m-0">
          {formatCurrency(amount)}
        </dd>
      </div>
    );
  };

  return (
    <div
      className="col-12 col-md-10 col-lg-9 mx-auto"
      style={{ textWrap: 'pretty' } as React.CSSProperties}
    >
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">
            {!assets ? <Shimmer height={34} /> : <FormattedMessage id="secondPillarGrowth.title" />}
          </h1>
          {!assets ? (
            <Shimmer height={60} />
          ) : (
            <p className="m-0 lead">
              <FormattedMessage
                id="secondPillarGrowth.lead"
                values={{
                  balance: formatCurrency(assets.balance),
                  ownPercentage:
                    segments && assets.balance > 0
                      ? Math.round((segments.contribution / assets.balance) * 100)
                      : 0,
                  b: (chunks: string) => <strong>{chunks}</strong>,
                }}
              />
            </p>
          )}
        </div>

        <div>
          <div className="card px-3 py-3 px-sm-4 py-sm-4">
            <div className="row g-4 align-items-center">
              <div className="col-md-7">
                <div style={{ minHeight: '360px' }}>
                  {!chartData ? (
                    <Shimmer height={340} />
                  ) : (
                    <Chart type="bar" data={chartData} options={chartOptions} />
                  )}
                </div>
              </div>

              <div className="col-md-5">
                {segments && assets ? (
                  <dl className="m-0" data-testid="account-list">
                    {orderedAccountRows(segments).map((row) =>
                      renderAccountRow(row.labelId, row.amount, row.color),
                    )}
                    <div className="d-flex justify-content-between align-items-center gap-2 py-2 fw-bold">
                      <dt id="secondPillarGrowth-account-balance" className="m-0">
                        <FormattedMessage id="secondPillarGrowth.account.balance" />
                      </dt>
                      <dd aria-labelledby="secondPillarGrowth-account-balance" className="m-0">
                        {formatCurrency(assets.balance)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="d-flex flex-column gap-2" data-testid="account-list-shimmer">
                    <Shimmer height={30} />
                    <Shimmer height={30} />
                    <Shimmer height={30} />
                    <Shimmer height={30} />
                  </div>
                )}
              </div>
            </div>
          </div>
          {subNoteKey && segments && assets && (
            <div className="text-secondary mt-2" data-testid="sub-note">
              <FormattedMessage
                id={`secondPillarGrowth.subNote.${subNoteKey}`}
                values={{
                  withdrawn: formatCurrency(-segments.withdrawn),
                  gross: formatCurrency(assets.withdrawals),
                  insurance: formatCurrency(assets.insurance),
                  ownContribution: formatCurrency(segments.contribution),
                  rest: formatCurrency(-segments.withdrawn - segments.contribution),
                  stateAmount: formatCurrency(segments.state),
                  b: (chunks: string) => <strong>{chunks}</strong>,
                }}
              />
            </div>
          )}
          {assets?.pikFlag && (
            <div className="text-secondary mt-2" role="note" data-testid="pik-disclaimer">
              <FormattedMessage id="secondPillarGrowth.pikDisclaimer" />
            </div>
          )}
        </div>

        <div className="d-flex flex-column gap-3">
          {!user ? (
            <>
              <Shimmer height={28} />
              <Shimmer height={30} />
              <Shimmer height={48} />
            </>
          ) : (
            ctaContent
          )}
        </div>

        <div className="d-flex flex-column gap-3" data-testid="methodology">
          <h2 className="m-0">
            <button
              id="methodologyToggle"
              className="btn p-0 border-0 focus-ring d-flex align-items-center gap-1 fw-normal"
              type="button"
              onClick={() => setMethodologyOpen(!methodologyOpen)}
              aria-expanded={methodologyOpen}
              aria-controls="methodologyContent"
            >
              <FormattedMessage id="secondPillarGrowth.methodology.summary" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                fill="currentColor"
                viewBox="0 0 16 16"
                style={{
                  transform: methodologyOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
              </svg>
            </button>
          </h2>
          <Collapse in={methodologyOpen}>
            <div id="methodologyContent" aria-labelledby="methodologyToggle">
              <div className="d-flex flex-column gap-3">
                <p className="m-0">
                  <FormattedMessage id="secondPillarGrowth.methodology.intro" />
                </p>
                <ul className="m-0">
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.own"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.state"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.return"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.inheritance"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.withdrawals"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="secondPillarGrowth.methodology.item.pik"
                      values={{ b: (c: string) => <strong>{c}</strong> }}
                    />
                  </li>
                </ul>
                <p className="m-0">
                  <FormattedMessage id="secondPillarGrowth.methodology.source" />
                </p>
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarGrowth;
