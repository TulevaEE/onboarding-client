import React, { useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  ChartType,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  Plugin,
  PointElement,
  ScriptableContext,
  ScriptableLineSegmentContext,
  Tooltip,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { coverageKind, MAX_AGE_SHOWN, Result } from './resultAnswers';
import {
  ChartRow,
  chartRowsOf,
  chartSeriesOf,
  ChartSourceId,
  startSourcesOf,
  tableRowsOf,
} from './chartData';

interface CostsLineOptions {
  amount: number;
  label: string;
}

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- chart.js declares this interface generic
  interface PluginOptionsByType<TType extends ChartType> {
    costs?: CostsLineOptions;
  }
}

const SOURCE_LABELS: Record<ChartSourceId, TranslationKey> = {
  salary: 'futureMe.result.chart.source.salary',
  firstPillar: 'futureMe.result.chart.source.firstPillar',
  specialPension: 'futureMe.result.chart.source.specialPension',
  secondPillar: 'futureMe.result.chart.source.secondPillar',
  thirdPillar: 'futureMe.result.chart.source.thirdPillar',
  deposit: 'futureMe.result.chart.source.deposit',
};

const SUMMARY_LABELS: Record<ChartSourceId, TranslationKey> = {
  salary: 'futureMe.result.chart.summary.salary',
  firstPillar: 'futureMe.result.chart.summary.firstPillar',
  specialPension: 'futureMe.result.chart.summary.specialPension',
  secondPillar: 'futureMe.result.chart.summary.secondPillar',
  thirdPillar: 'futureMe.result.chart.summary.thirdPillar',
  deposit: 'futureMe.result.chart.summary.deposit',
};

const SOURCE_COLORS: Record<ChartSourceId, string> = {
  salary: '#4d7c0f',
  firstPillar: '#6a4fc4',
  specialPension: '#00796b',
  secondPillar: '#0088c2',
  thirdPillar: '#c26f00',
  deposit: '#b8457a',
};

const COSTS_COLOR = '#db2200';
const HALO_COLOR = '#fff';
const TICK_COLOR = '#6b7074';
const AXIS_BORDER_COLOR = '#d9dee3';
const FONT = { size: 13 };
const PILL_FONT = '700 12px Roboto, sans-serif';
const PILL_HEIGHT = 20;
const PILL_PADDING = 8;
const NARROW_SCREEN = '(max-width: 575.98px)';
const WIDE_TICK_STEP = 5;
const NARROW_TICK_STEP = 10;
const DOT_EVERY_YEARS = 2;
const Y_AXIS_WIDTH = 76;
const THOUSAND = 1000;

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
);

const drawPill = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
  ctx.save();
  ctx.font = PILL_FONT;
  const width = Math.ceil(ctx.measureText(text).width) + 2 * PILL_PADDING;
  ctx.beginPath();
  ctx.roundRect(x, y, width, PILL_HEIGHT, PILL_HEIGHT / 2);
  ctx.fillStyle = COSTS_COLOR;
  ctx.fill();
  ctx.fillStyle = HALO_COLOR;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + PILL_PADDING, y + PILL_HEIGHT / 2);
  ctx.restore();
};

const costsY = (chart: ChartJS<'line'>, options: CostsLineOptions) =>
  chart.scales.y.getPixelForValue(options.amount);

const costsLine: Plugin<'line'> = {
  id: 'costs',
  beforeDatasetsDraw(chart, _args, options: CostsLineOptions) {
    const { ctx, chartArea } = chart;
    const y = costsY(chart, options);
    const stroke = (color: string, width: number, dash: number[]) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.restore();
    };
    stroke(HALO_COLOR, 6, []);
    stroke(COSTS_COLOR, 2.5, [2, 6]);
  },
  afterDatasetsDraw(chart, _args, options: CostsLineOptions) {
    drawPill(
      chart.ctx,
      chart.chartArea.left + 6,
      costsY(chart, options) - PILL_HEIGHT / 2,
      options.label,
    );
  },
};

const transparent = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  // eslint-disable-next-line no-bitwise
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

const fadingFill = (color: string) => (context: ScriptableContext<'line'>) => {
  const { chartArea, ctx } = context.chart;
  if (!chartArea) {
    return transparent(color, 0.3);
  }
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, transparent(color, 0.5));
  gradient.addColorStop(1, transparent(color, 0.08));
  return gradient;
};

const hideWherePaysNothing = ({ p0, p1 }: ScriptableLineSegmentContext) =>
  p0.parsed.y === 0 && p1.parsed.y === 0 ? 'transparent' : undefined;

const shortAmount = (value: number | string) => {
  const amount = Number(value);
  return amount >= THOUSAND
    ? `${(amount / THOUSAND).toLocaleString('et-EE', { maximumFractionDigits: 1 })} tuh`
    : String(amount);
};

const Summary = ({ result, rows }: { result: Result; rows: ChartRow[] }) => {
  const intl = useIntl();
  const [start] = rows;
  const sources = startSourcesOf(start).map((id) =>
    intl.formatMessage({ id: SUMMARY_LABELS[id] }, { amount: euro(start[id]) }),
  );
  const until = result.coversNeedUntil ?? MAX_AGE_SHOWN;
  const gapEnd = result.gapEnd ?? until;
  return (
    <ul
      id="future-me-chart-summary"
      className="result-chart-summary"
      aria-label={intl.formatMessage({ id: 'futureMe.result.chart.summary.label' })}
    >
      <li>
        <FormattedMessage
          id="futureMe.result.chart.summary.start"
          values={{ age: result.pensionStartAge, sources: intl.formatList(sources) }}
        />
      </li>
      <li>
        <FormattedMessage
          id="futureMe.result.chart.summary.costs"
          values={{ amount: euro(start.costs) }}
        />
      </li>
      <li>
        <FormattedMessage
          id="futureMe.result.chart.summary.covered"
          values={{
            kind: coverageKind(result),
            until,
            to: gapEnd,
            isRange: gapEnd > until ? 'yes' : 'no',
          }}
        />
      </li>
    </ul>
  );
};

const IncomeChart = ({ rows }: { rows: ChartRow[] }) => {
  const intl = useIntl();
  const isNarrow = window.matchMedia(NARROW_SCREEN).matches;
  const tickStep = isNarrow ? NARROW_TICK_STEP : WIDE_TICK_STEP;
  const [{ costs }] = rows;
  const data: ChartData<'line'> = {
    labels: rows.map(({ age }) => age),
    datasets: chartSeriesOf(rows).map(({ id, data: values }, index) => ({
      type: 'line' as const,
      label: intl.formatMessage({ id: SOURCE_LABELS[id] }),
      data: values,
      fill: index === 0 ? 'origin' : '-1',
      stack: 'income',
      borderColor: SOURCE_COLORS[id],
      borderWidth: 1.5,
      backgroundColor: fadingFill(SOURCE_COLORS[id]),
      pointRadius: rows.map(({ age }, row) =>
        values[row] > 0 && age % DOT_EVERY_YEARS === 0 ? 3 : 0,
      ),
      segment: { borderColor: hideWherePaysNothing },
      pointHoverRadius: 5,
      pointBackgroundColor: SOURCE_COLORS[id],
      tension: 0.2,
    })),
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: ([item]) => `${item.label} a`,
          label: (item) => `${item.dataset.label}: ${euro(item.parsed.y)}`,
        },
      },
      costs: {
        amount: costs,
        label: intl.formatMessage(
          { id: 'futureMe.result.chart.costsLabel' },
          { amount: euro(costs) },
        ),
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: AXIS_BORDER_COLOR },
        title: {
          display: true,
          text: intl.formatMessage({ id: 'futureMe.result.chart.axis.age' }),
          color: TICK_COLOR,
          font: FONT,
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          color: TICK_COLOR,
          font: FONT,
          callback: (_value, index) => (rows[index].age % tickStep === 0 ? rows[index].age : ''),
        },
      },
      y: {
        position: 'right',
        stacked: true,
        beginAtZero: true,
        suggestedMax: costs,
        grace: '20%',
        border: { display: false },
        grid: { display: false },
        afterFit: (scale) => {
          // eslint-disable-next-line no-param-reassign
          scale.width = Y_AXIS_WIDTH;
        },
        ticks: { maxTicksLimit: 5, color: TICK_COLOR, font: FONT, callback: shortAmount },
      },
    },
  };
  return (
    <>
      <p className="result-chart-unit text-secondary" aria-hidden="true">
        <FormattedMessage id="futureMe.result.chart.unit" />
      </p>
      <div className="result-chart">
        <Chart
          type="line"
          data={data}
          options={options}
          plugins={[costsLine]}
          role="img"
          aria-labelledby="future-me-chart-title"
          aria-describedby="future-me-chart-summary"
        />
      </div>
    </>
  );
};

const Legend = ({ rows }: { rows: ChartRow[] }) => {
  const intl = useIntl();
  return (
    <ul
      className="result-chart-legend"
      aria-label={intl.formatMessage({ id: 'futureMe.result.chart.legend' })}
    >
      {chartSeriesOf(rows).map(({ id }) => (
        <li key={id}>
          <span
            className="result-chart-swatch"
            style={{ backgroundColor: SOURCE_COLORS[id] }}
            aria-hidden="true"
          />
          <FormattedMessage id={SOURCE_LABELS[id]} />
        </li>
      ))}
      <li>
        <span className="result-chart-swatch result-chart-swatch-costs" aria-hidden="true" />
        <FormattedMessage id="futureMe.result.chart.costs" />
      </li>
    </ul>
  );
};

const IncomeTable = ({ rows }: { rows: ChartRow[] }) => {
  const sources = chartSeriesOf(rows).map(({ id }) => id);
  return (
    <div
      className="table-responsive result-chart-table"
      role="region"
      aria-labelledby="future-me-chart-table-caption"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region must take keyboard focus (WCAG 2.1.1)
      tabIndex={0}
    >
      <table className="table table-sm align-middle mb-0">
        <caption id="future-me-chart-table-caption">
          <FormattedMessage id="futureMe.result.chart.table.caption" />
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <FormattedMessage id="futureMe.result.chart.table.age" />
            </th>
            {sources.map((id) => (
              <th key={id} scope="col" className="text-end">
                <FormattedMessage id={SOURCE_LABELS[id]} />
              </th>
            ))}
            <th scope="col" className="text-end">
              <FormattedMessage id="futureMe.result.chart.costs" />
            </th>
          </tr>
        </thead>
        <tbody>
          {tableRowsOf(rows).map((row) => (
            <tr key={row.age}>
              <th scope="row">{row.age}</th>
              {sources.map((id) => (
                <td key={id} className="text-end">
                  {euro(row[id])}
                </td>
              ))}
              <td className="text-end">{euro(row.costs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ResultChart = ({ result, need }: { result: Result; need: number }) => {
  const [isTableShown, setTableShown] = useState(false);
  const rows = chartRowsOf(result, need);
  return (
    <figure className="result-figure" aria-labelledby="future-me-chart-title">
      <div className="result-figure-head">
        <h3 id="future-me-chart-title" className="h5 section-title">
          <FormattedMessage id="futureMe.result.chart.title" />
        </h3>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          aria-expanded={isTableShown}
          aria-controls="future-me-chart-table"
          onClick={() => setTableShown(!isTableShown)}
        >
          <FormattedMessage
            id={
              isTableShown
                ? 'futureMe.result.chart.toggle.hide'
                : 'futureMe.result.chart.toggle.show'
            }
          />
        </button>
      </div>
      <Summary result={result} rows={rows} />
      <div id="future-me-chart-table">{isTableShown && <IncomeTable rows={rows} />}</div>
      <IncomeChart rows={rows} />
      <Legend rows={rows} />
    </figure>
  );
};
