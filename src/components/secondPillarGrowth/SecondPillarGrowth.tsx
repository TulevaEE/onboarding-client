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

const COLOR_SINU = '#156B3B';
const COLOR_RIIK = '#2E8B57';
const COLOR_PARIMINE = '#8B5CF6';
const COLOR_TOOTLUS = '#5AB4E6';
const COLOR_VALJAMAKSED = '#F0CB5B';

const BLOG_URL = 'https://tuleva.ee/analuusid/kes-maksab-minu-ii-sambasse/';

const SecondPillarGrowth = () => {
  const intl = useIntl();
  usePageTitle('pageTitle.secondPillarGrowth');
  const { data: assets } = useSecondPillarAssets();

  const segments = useMemo(() => {
    if (!assets) {
      return null;
    }
    const sinu = assets.employeeWithheldPortion;
    const riikJaMuud =
      assets.socialTaxPortion +
      assets.additionalParentalBenefit +
      assets.compensation +
      assets.interest +
      assets.insurance +
      assets.corrections;
    const parimine = assets.inheritance;
    const tootlus = assets.balance + assets.withdrawals - sinu - riikJaMuud - parimine;
    const valjamaksed = -assets.withdrawals;
    return { sinu, riikJaMuud, parimine, tootlus, valjamaksed };
  }, [assets]);

  const subNoteKey = useMemo(() => {
    if (!segments || !assets || assets.pikFlag) {
      return null;
    }
    const hasWithdrawals = assets.withdrawals > 0;
    const hasNegativeReturn = segments.tootlus < 0;
    if (hasWithdrawals && hasNegativeReturn) {
      return 'withdrawalsAndNegative';
    }
    if (hasWithdrawals) {
      return 'withdrawals';
    }
    if (hasNegativeReturn) {
      return 'negativeReturn';
    }
    if (segments.sinu === 0 && segments.riikJaMuud > 0) {
      return 'parentalLeave';
    }
    return null;
  }, [segments, assets]);

  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('et-EE')} €`;

  const chartData = segments
    ? {
        labels: [intl.formatMessage({ id: 'secondPillarGrowth.chart.label' })],
        datasets: [
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.yourContributions' }),
            data: [segments.sinu],
            backgroundColor: COLOR_SINU,
            hoverBackgroundColor: '#0F5530',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.government' }),
            data: [segments.riikJaMuud],
            backgroundColor: COLOR_RIIK,
            hoverBackgroundColor: '#256F45',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          ...(segments.parimine > 0
            ? [
                {
                  label: intl.formatMessage({ id: 'secondPillarGrowth.chart.inheritance' }),
                  data: [segments.parimine],
                  backgroundColor: COLOR_PARIMINE,
                  hoverBackgroundColor: '#7048D8',
                  borderColor: STACKED_BAR_SEPARATOR_COLOR,
                  borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
                  borderSkipped: false,
                  stack: STACK_KEY,
                },
              ]
            : []),
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.growth' }),
            data: [segments.tootlus],
            backgroundColor: COLOR_TOOTLUS,
            hoverBackgroundColor: '#3A9ED0',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.withdrawals' }),
            data: [segments.valjamaksed],
            backgroundColor: COLOR_VALJAMAKSED,
            hoverBackgroundColor: '#D4B043',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        position: 'top' as const,
        onClick: () => undefined,
        labels: {
          boxWidth: 16,
          boxHeight: 16,
          padding: 16,
          useBorderRadius: true,
          borderRadius: 8,
          color: '#6B7074',
        },
      },
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
      datalabels: { display: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { color: '#D6DEE6' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grace: '10%' as const,
        grid: {
          color: (ctx: { tick: { value: number } }) =>
            ctx.tick.value === 0 ? '#6B7074' : 'rgba(0,0,0,0)',
        },
      },
    },
  };

  const renderAccountRow = (
    labelId: TranslationKey,
    amount: number,
    swatchColor: string,
    options: { negative?: boolean } = {},
  ) => (
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
      <span className={options.negative ? 'text-danger' : ''}>{formatCurrency(amount)}</span>
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

        <div className="row g-4">
          <div className="col-md-7">
            <div className="card px-2 py-3 px-sm-5 py-sm-4" style={{ minHeight: '420px' }}>
              {!chartData ? (
                <Shimmer height={370} />
              ) : (
                <Chart type="bar" data={chartData} options={chartOptions} />
              )}
            </div>
            {assets?.pikFlag && (
              <div className="alert alert-info mt-3 mb-0" role="note" data-testid="pik-disclaimer">
                <FormattedMessage id="secondPillarGrowth.pikDisclaimer" />
              </div>
            )}
            {subNoteKey && segments && assets && (
              <div className="text-body-secondary mt-3" data-testid="sub-note">
                <FormattedMessage
                  id={`secondPillarGrowth.subNote.${subNoteKey}`}
                  values={{
                    withdrawn: formatCurrency(assets.withdrawals),
                    ownContribution: formatCurrency(segments.sinu),
                    rest: formatCurrency(assets.withdrawals - segments.sinu),
                    stateAmount: formatCurrency(segments.riikJaMuud),
                    b: (chunks: string) => <strong>{chunks}</strong>,
                  }}
                />
              </div>
            )}
          </div>

          <div className="col-md-5">
            {segments && assets && (
              <dl className="m-0" data-testid="account-list">
                {renderAccountRow('secondPillarGrowth.account.own', segments.sinu, COLOR_SINU)}
                {renderAccountRow(
                  'secondPillarGrowth.account.government',
                  segments.riikJaMuud,
                  COLOR_RIIK,
                )}
                {segments.parimine > 0 &&
                  renderAccountRow(
                    'secondPillarGrowth.account.inheritance',
                    segments.parimine,
                    COLOR_PARIMINE,
                  )}
                {renderAccountRow(
                  'secondPillarGrowth.account.growth',
                  segments.tootlus,
                  COLOR_TOOTLUS,
                  { negative: segments.tootlus < 0 },
                )}
                {assets.withdrawals > 0 &&
                  renderAccountRow(
                    'secondPillarGrowth.account.withdrawals',
                    segments.valjamaksed,
                    COLOR_VALJAMAKSED,
                    { negative: true },
                  )}
                <div className="d-flex justify-content-between align-items-center py-2 fw-bold border-top border-2 mt-1 pt-2">
                  <span>
                    <FormattedMessage id="secondPillarGrowth.account.balance" />
                  </span>
                  <span>{formatCurrency(assets.balance)}</span>
                </div>
              </dl>
            )}
          </div>
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
