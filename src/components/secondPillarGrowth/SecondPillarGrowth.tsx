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

const CHART_FONT_FAMILY = '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const DATALABEL_FONT_SIZE = 16;
const DATALABEL_FONT_LINE_HEIGHT = 1.25;
const STACKED_BAR_SEPARATOR_WIDTH = 1;
const STACKED_BAR_SEPARATOR_COLOR = '#fff';

const STACK_KEY = 'balance';

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
      assets.corrections +
      assets.inheritance;
    const tootlus = assets.balance + assets.withdrawals - sinu - riikJaMuud;
    const valjamaksed = -assets.withdrawals;
    return { sinu, riikJaMuud, tootlus, valjamaksed, balance: assets.balance };
  }, [assets]);

  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString('et-EE')} €`;

  const chartData = segments
    ? {
        labels: [intl.formatMessage({ id: 'secondPillarGrowth.chart.label' })],
        datasets: [
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.yourContributions' }),
            data: [segments.sinu],
            backgroundColor: '#156B3B',
            hoverBackgroundColor: '#0F5530',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.government' }),
            data: [segments.riikJaMuud],
            backgroundColor: '#2E8B57',
            hoverBackgroundColor: '#256F45',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.growth' }),
            data: [segments.tootlus],
            backgroundColor: '#5AB4E6',
            hoverBackgroundColor: '#3A9ED0',
            borderColor: STACKED_BAR_SEPARATOR_COLOR,
            borderWidth: { bottom: STACKED_BAR_SEPARATOR_WIDTH },
            borderSkipped: false,
            stack: STACK_KEY,
          },
          {
            label: intl.formatMessage({ id: 'secondPillarGrowth.chart.withdrawals' }),
            data: [segments.valjamaksed],
            backgroundColor: '#F0CB5B',
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
      datalabels: {
        color: '#212529',
        font: {
          family: CHART_FONT_FAMILY,
          size: DATALABEL_FONT_SIZE,
          lineHeight: DATALABEL_FONT_LINE_HEIGHT,
          weight: 'bold' as const,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter(value: number) {
          if (Math.abs(value) < 1) {
            return '';
          }
          return formatCurrency(value);
        },
      },
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

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0">
            {!assets ? <Shimmer height={34} /> : <FormattedMessage id="secondPillarGrowth.title" />}
          </h1>
          {!segments ? (
            <Shimmer height={60} />
          ) : (
            <p className="m-0 lead">
              <FormattedMessage
                id="secondPillarGrowth.lead"
                values={{
                  balance: formatCurrency(segments.balance),
                  b: (chunks: string) => <strong>{chunks}</strong>,
                }}
              />
            </p>
          )}
        </div>
        <div>
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
        </div>
      </div>
    </div>
  );
};

export default SecondPillarGrowth;
