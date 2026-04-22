import React, { useMemo } from 'react';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePageTitle } from '../common/usePageTitle';
import { useSecondPillarAssets } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { formatAmountForCurrency } from '../common/utils';
import { TranslationKey } from '../translations';

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

const STACKED_BAR_SEPARATOR_WIDTH = 1;
const STACKED_BAR_SEPARATOR_COLOR = '#fff';
const STACK_KEY = 'balance';

// Chart palette reuses the tax-win page's softer hues (see
// SecondPillarTaxWin.tsx) so the two 2nd-pillar charts feel
// consistent. Each segment comes from a distinct hue family.
const COLOR_CONTRIBUTION = 'rgba(132,197,230,0.7)'; // tax-win light blue — your contribution
const COLOR_STATE = '#D0D5DC'; // tax-win gray — neutral state share
const COLOR_INHERITANCE = '#8B5CF6'; // violet — rare inherited amount, distinct from the rest
// Growth is semantic: positive = nicer tax-win green, loss = softer red.
const COLOR_GROWTH_POSITIVE = '#4CBB51'; // tax-win green
const COLOR_GROWTH_NEGATIVE = '#E74C3C'; // soft red companion
const COLOR_WITHDRAWN = '#F0CB5B'; // warm mustard — outflow

const HOVER_CONTRIBUTION = 'rgba(83,175,220,0.7)';
const HOVER_STATE = '#B5BEC8';
const HOVER_INHERITANCE = '#7048D8';
const HOVER_GROWTH_POSITIVE = '#409D44';
const HOVER_GROWTH_NEGATIVE = '#C0392B';
const HOVER_WITHDRAWN = '#D4B043';

const BLOG_URL = 'https://tuleva.ee/analuusid/kes-maksab-minu-ii-sambasse/';

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

const orderedAccountRows = (segments: Segments, withdrawals: number): AccountRow[] => {
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
  rows.push({
    labelId: 'secondPillarGrowth.account.government',
    amount: segments.state,
    color: COLOR_STATE,
  });
  rows.push({
    labelId: 'secondPillarGrowth.account.own',
    amount: segments.contribution,
    color: COLOR_CONTRIBUTION,
  });
  // Negative segments, closest-to-zero first
  if (segments.growth < 0) {
    rows.push({
      labelId: 'secondPillarGrowth.account.growth',
      amount: segments.growth,
      color: growthColor,
    });
  }
  if (withdrawals > 0) {
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

  const segments: Segments | null = useMemo(() => {
    if (!assets) {
      return null;
    }
    const contribution = assets.employeeWithheldPortion;
    const state =
      assets.socialTaxPortion +
      assets.additionalParentalBenefit +
      assets.compensation +
      assets.interest +
      assets.insurance +
      assets.corrections;
    const { inheritance } = assets;
    const growth = assets.balance + assets.withdrawals - contribution - state - inheritance;
    const withdrawn = -assets.withdrawals;
    return { contribution, state, inheritance, growth, withdrawn };
  }, [assets]);

  const subNoteKey = useMemo(() => {
    if (!segments || !assets || assets.pikFlag) {
      return null;
    }
    const hasWithdrawals = assets.withdrawals > 0;
    const hasNegativeReturn = segments.growth < 0;
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

<<<<<<< HEAD
  const formatCurrency = (value: number) => formatAmountForCurrency(value, 0);
=======
  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('et-EE')} €`;
>>>>>>> a7d59b91 (2nd-pillar-growth: non-breaking spaces around "II sammas" forms and currency)

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        bodyColor: '#212529',
        titleColor: '#212529',
        borderColor: 'rgba(0, 0, 0, 0.16)',
        borderWidth: 1,
        cornerRadius: 8,
        caretSize: 6,
        usePointStyle: true,
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
        beginAtZero: true,
        grace: '25%' as const,
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

  const renderAccountRow = (labelId: TranslationKey, amount: number, swatchColor: string) => (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <span className="d-flex align-items-center gap-2">
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: swatchColor,
          }}
        />
        <FormattedMessage id={labelId} />
      </span>
      <span>{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="col-12 col-md-10 col-lg-9 mx-auto">
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
                  b: (chunks: string) => <strong>{chunks}</strong>,
                }}
              />
            </p>
          )}
        </div>

        <div>
          <div className="card px-2 py-3 px-sm-4 py-sm-4">
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
                {segments && assets && (
                  <dl className="m-0" data-testid="account-list">
                    {orderedAccountRows(segments, assets.withdrawals).map((row) =>
                      renderAccountRow(row.labelId, row.amount, row.color),
                    )}
                    <div className="d-flex justify-content-between align-items-center py-2 fw-bold">
                      <span>
                        <FormattedMessage id="secondPillarGrowth.account.balance" />
                      </span>
                      <span>{formatCurrency(assets.balance)}</span>
                    </div>
                  </dl>
                )}
              </div>
            </div>
          </div>
          {subNoteKey && segments && assets && (
            <div className="text-secondary mt-1" data-testid="sub-note">
              <FormattedMessage
                id={`secondPillarGrowth.subNote.${subNoteKey}`}
                values={{
                  withdrawn: formatCurrency(assets.withdrawals),
                  ownContribution: formatCurrency(segments.contribution),
                  rest: formatCurrency(assets.withdrawals - segments.contribution),
                  stateAmount: formatCurrency(segments.state),
                  b: (chunks: string) => <strong>{chunks}</strong>,
                }}
              />
            </div>
          )}
          {assets?.pikFlag && (
            <div className="text-secondary mt-1" role="note" data-testid="pik-disclaimer">
              <FormattedMessage id="secondPillarGrowth.pikDisclaimer" />
            </div>
          )}
        </div>

        <div className="d-flex flex-column gap-3">
          <p className="m-0">
            <a
              className="icon-link icon-link-hover fw-medium lead"
              href={BLOG_URL}
              target="_blank"
              rel="noreferrer"
            >
              <FormattedMessage id="secondPillarGrowth.blogLink" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                />
              </svg>
            </a>
          </p>

          <details className="text-body-secondary" data-testid="methodology">
            <summary className="fw-medium" style={{ cursor: 'pointer' }}>
              <FormattedMessage id="secondPillarGrowth.methodology.summary" />
            </summary>
            <div className="mt-2 small">
              <p>
                <FormattedMessage id="secondPillarGrowth.methodology.intro" />
              </p>
              <ul>
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
              <p className="mb-0">
                <FormattedMessage id="secondPillarGrowth.methodology.source" />
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarGrowth;
