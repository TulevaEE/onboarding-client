import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScriptableContext,
  ScriptableLineSegmentContext,
  Tooltip,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
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
import { ChartEvent, chartEventsOf } from './chartEvents';
import { ChartMark, costsLine, marksLine } from './chartPlugins';
import { SOURCE_COLORS, SOURCE_LABELS } from './chartSources';
import { announcementOf } from './chartText';
import { ResultChartTip } from './ResultChartTip';

const SUMMARY_LABELS: Record<ChartSourceId, TranslationKey> = {
  salary: 'futureMe.result.chart.summary.salary',
  firstPillar: 'futureMe.result.chart.summary.firstPillar',
  specialPension: 'futureMe.result.chart.summary.specialPension',
  secondPillar: 'futureMe.result.chart.summary.secondPillar',
  thirdPillar: 'futureMe.result.chart.summary.thirdPillar',
  deposit: 'futureMe.result.chart.summary.deposit',
};

const HALO_COLOR = '#fff';
const TICK_COLOR = '#6b7074';
const AXIS_BORDER_COLOR = '#d9dee3';
const FONT = { size: 13 };
const NARROW_SCREEN = '(max-width: 575.98px)';
const WIDE_TICK_STEP = 5;
const NARROW_TICK_STEP = 10;
const DOT_EVERY_YEARS = 2;
const DOT_RADIUS = 3;
const EVENT_DOT_RADIUS = 6;
const HOVER_RADIUS = 5;
const EVENT_HOVER_RADIUS = 8;
const EVENT_DOT_BORDER = 2;
const TIP_GAP = 10;
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

interface IncomeChartProps {
  rows: ChartRow[];
  events: ChartEvent[];
  hidden: ReadonlySet<ChartSourceId>;
  announce: (text: string) => void;
}

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

const MARK_LABELS: Partial<Record<ChartEvent['kind'], TranslationKey>> = {
  pension: 'futureMe.result.chart.mark.pension',
  workEnd: 'futureMe.result.chart.mark.workEnd',
  moneyEnd: 'futureMe.result.chart.mark.moneyEnd',
};

const FUND_END_MARK_LABELS: Record<NonNullable<ChartEvent['pillars']>, TranslationKey> = {
  both: 'futureMe.result.chart.mark.fundEnd',
  second: 'futureMe.result.chart.mark.fundEndSecond',
  third: 'futureMe.result.chart.mark.fundEndThird',
};

const marksOf = (intl: IntlShape, events: ChartEvent[]): ChartMark[] =>
  events.flatMap(({ kind, age, pillars }) => {
    const id = kind === 'fundEnd' && pillars ? FUND_END_MARK_LABELS[pillars] : MARK_LABELS[kind];
    return id ? [{ age, text: intl.formatMessage({ id }, { age }) }] : [];
  });

const dotRadiusOf = (age: number, isEvent: boolean) => {
  if (isEvent) {
    return EVENT_DOT_RADIUS;
  }
  return age % DOT_EVERY_YEARS === 0 ? DOT_RADIUS : 0;
};

const datasetsOf = (
  intl: IntlShape,
  rows: ChartRow[],
  layers: ChartSourceId[],
  hidden: ReadonlySet<ChartSourceId>,
  eventAges: ReadonlySet<number>,
): ChartData<'line'>['datasets'] => {
  let below: number | 'origin' = 'origin';
  return layers.map((id, index) => {
    const values = rows.map((row) => row[id]);
    const isHidden = hidden.has(id);
    const fill = isHidden ? false : below;
    if (!isHidden) {
      below = index;
    }
    const paysAt = (row: number) => values[row] > 0;
    const isEventAt = (row: number) => eventAges.has(rows[row].age);
    return {
      type: 'line' as const,
      label: intl.formatMessage({ id: SOURCE_LABELS[id] }),
      data: values,
      hidden: isHidden,
      fill,
      stack: 'income',
      borderColor: SOURCE_COLORS[id],
      borderWidth: 1.5,
      backgroundColor: fadingFill(SOURCE_COLORS[id]),
      pointRadius: rows.map((row, at) => (paysAt(at) ? dotRadiusOf(row.age, isEventAt(at)) : 0)),
      pointHoverRadius: rows.map((_row, at) => {
        if (!paysAt(at)) {
          return 0;
        }
        return isEventAt(at) ? EVENT_HOVER_RADIUS : HOVER_RADIUS;
      }),
      pointBackgroundColor: SOURCE_COLORS[id],
      pointBorderColor: HALO_COLOR,
      pointBorderWidth: rows.map((_row, at) =>
        paysAt(at) && isEventAt(at) ? EVENT_DOT_BORDER : 0,
      ),
      pointHoverBorderColor: HALO_COLOR,
      pointHoverBorderWidth: EVENT_DOT_BORDER,
      segment: { borderColor: hideWherePaysNothing },
      tension: 0.2,
    };
  });
};

const IncomeChart = ({ rows, events, hidden, announce }: IncomeChartProps) => {
  const intl = useIntl();
  const chartRef = useRef<ChartJS<'line'>>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const isPressedWithMouse = useRef(false);
  const hasHighlight = useRef(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const layers = useMemo(() => chartSeriesOf(rows).map(({ id }) => id), [rows]);
  const visibleLayers = layers.filter((id) => !hidden.has(id));
  const eventAges = useMemo(() => new Set(events.map(({ age }) => age)), [events]);
  const stops = useMemo(
    () =>
      rows.flatMap(({ age }, index) =>
        eventAges.has(age) || age % DOT_EVERY_YEARS === 0 ? [index] : [],
      ),
    [rows, eventAges],
  );

  const eventsAt = (index: number) => events.filter(({ age }) => age === rows[index].age);
  const close = () => setActiveIndex(null);
  const goTo = (index: number) => {
    setActiveIndex(index);
    announce(announcementOf(intl, rows[index], eventsAt(index), visibleLayers));
  };

  const isHeadingForTip = (x: number, index: number) => {
    const tip = tipRef.current;
    const chart = chartRef.current;
    if (!tip || !chart) {
      return false;
    }
    const lineX = chart.scales.x.getPixelForValue(index);
    const tipRight = tip.offsetLeft + tip.offsetWidth;
    return tip.offsetLeft > lineX
      ? x > lineX && x < tip.offsetLeft + 2
      : x < lineX && x > tipRight - 2;
  };

  const { data, options } = useMemo(() => {
    const [{ costs }] = rows;
    const isNarrow = window.matchMedia(NARROW_SCREEN).matches;
    const tickStep = isNarrow ? NARROW_TICK_STEP : WIDE_TICK_STEP;
    const chartData: ChartData<'line'> = {
      labels: rows.map(({ age }) => age),
      datasets: datasetsOf(intl, rows, layers, hidden, eventAges),
    };
    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      onHover: ({ x }, elements) => {
        const [element] = elements;
        if (!element) {
          return;
        }
        const shown = activeIndexRef.current;
        const isOnWayToTip = shown !== null && x !== null && isHeadingForTip(x, shown);
        if (!isOnWayToTip) {
          setActiveIndex(element.index);
        }
      },
      plugins: {
        datalabels: { display: false },
        legend: { display: false },
        tooltip: { enabled: false },
        marks: marksOf(intl, events),
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
    return { data: chartData, options: chartOptions };
  }, [intl, rows, events, layers, hidden, eventAges]);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    const tip = tipRef.current;
    const plot = plotRef.current;
    const crosshair = crosshairRef.current;
    if (activeIndex === null || !chart || !tip || !plot || !crosshair) {
      return;
    }
    const x = chart.scales.x.getPixelForValue(activeIndex);
    const fitsRight = x + TIP_GAP + tip.offsetWidth <= plot.clientWidth;
    const { top, bottom } = chart.chartArea;
    tip.style.left = `${Math.max(0, fitsRight ? x + TIP_GAP : x - TIP_GAP - tip.offsetWidth)}px`;
    tip.style.top = `${top}px`;
    crosshair.style.left = `${x}px`;
    crosshair.style.top = `${top}px`;
    crosshair.style.height = `${bottom - top}px`;
  }, [activeIndex, hidden]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || (activeIndex === null && !hasHighlight.current)) {
      return;
    }
    hasHighlight.current = activeIndex !== null;
    const highlighted =
      activeIndex === null
        ? []
        : layers.flatMap((id, datasetIndex) =>
            !hidden.has(id) && rows[activeIndex][id] > 0
              ? [{ datasetIndex, index: activeIndex }]
              : [],
          );
    chart.setActiveElements(highlighted);
    chart.update();
  }, [activeIndex, layers, hidden, rows]);

  useEffect(() => {
    if (activeIndex === null) {
      return undefined;
    }
    const closeWhenOutside = ({ target }: Event) => {
      if (!plotRef.current?.contains(target as Node)) {
        close();
      }
    };
    const closeOnEscape = ({ key }: KeyboardEvent) => {
      if (key === 'Escape') {
        close();
      }
    };
    document.addEventListener('mousedown', closeWhenOutside);
    document.addEventListener('touchstart', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside);
      document.removeEventListener('touchstart', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeIndex === null]);

  const moveWithKey = (event: React.KeyboardEvent) => {
    if (!NAVIGATION_KEYS.includes(event.key)) {
      return;
    }
    event.preventDefault();
    const current = activeIndex ?? -1;
    const target = {
      ArrowRight: stops.find((stop) => stop > current),
      ArrowLeft: [...stops].reverse().find((stop) => stop < current),
      Home: stops[0],
      End: stops[stops.length - 1],
    }[event.key as 'ArrowRight' | 'ArrowLeft' | 'Home' | 'End'];
    goTo(target ?? activeIndex ?? stops[0]);
  };

  const focusFirstStop = () => {
    if (isPressedWithMouse.current) {
      return;
    }
    goTo(stops[0]);
  };

  const closeWhenFocusLeaves = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      close();
    }
  };

  return (
    <>
      <p className="result-chart-unit text-secondary" aria-hidden="true">
        <FormattedMessage id="futureMe.result.chart.unit" />
      </p>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the chart inside takes the keys, this only closes the tooltip when the pointer or the focus leaves */}
      <div
        ref={plotRef}
        className="result-chart"
        onMouseLeave={close}
        onBlur={closeWhenFocusLeaves}
      >
        <Chart
          ref={chartRef}
          type="line"
          data={data}
          options={options}
          plugins={[costsLine, marksLine]}
          role="img"
          tabIndex={0}
          aria-labelledby="future-me-chart-title"
          aria-describedby="future-me-chart-summary future-me-chart-keys"
          onKeyDown={moveWithKey}
          onFocus={focusFirstStop}
          onMouseDown={() => {
            isPressedWithMouse.current = true;
          }}
          onMouseUp={() => {
            isPressedWithMouse.current = false;
          }}
        />
        {activeIndex !== null && (
          <>
            <div ref={crosshairRef} className="result-chart-crosshair" aria-hidden="true" />
            <ResultChartTip
              ref={tipRef}
              row={rows[activeIndex]}
              events={eventsAt(activeIndex)}
              layers={visibleLayers}
              onClose={close}
            />
          </>
        )}
      </div>
      <p id="future-me-chart-keys" className="visually-hidden">
        <FormattedMessage id="futureMe.result.chart.keys" />
      </p>
    </>
  );
};

interface LegendProps {
  rows: ChartRow[];
  hidden: ReadonlySet<ChartSourceId>;
  onToggle: (id: ChartSourceId) => void;
}

const Legend = ({ rows, hidden, onToggle }: LegendProps) => {
  const intl = useIntl();
  return (
    <>
      <p id="future-me-chart-legend-hint" className="result-chart-legend-hint text-secondary">
        <FormattedMessage id="futureMe.result.chart.legend.hint" />
      </p>
      <ul
        className="result-chart-legend"
        aria-label={intl.formatMessage({ id: 'futureMe.result.chart.legend' })}
      >
        {chartSeriesOf(rows).map(({ id }) => (
          <li key={id}>
            <button
              type="button"
              className="btn btn-sm rounded-pill result-chart-toggle"
              style={{ '--layer-color': SOURCE_COLORS[id] } as React.CSSProperties}
              aria-pressed={!hidden.has(id)}
              aria-describedby="future-me-chart-legend-hint"
              onClick={() => onToggle(id)}
            >
              <span className="result-chart-toggle-icon" aria-hidden="true">
                {hidden.has(id) ? '+' : '✓'}
              </span>
              <span className="result-chart-toggle-dot" aria-hidden="true" />
              <FormattedMessage id={SOURCE_LABELS[id]} />
            </button>
          </li>
        ))}
        <li>
          <span className="result-chart-swatch result-chart-swatch-costs" aria-hidden="true" />
          <FormattedMessage id="futureMe.result.chart.costs" />
        </li>
      </ul>
    </>
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
  const intl = useIntl();
  const [isTableShown, setTableShown] = useState(false);
  const [hidden, setHidden] = useState<ReadonlySet<ChartSourceId>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const rows = useMemo(() => chartRowsOf(result, need), [result, need]);
  const events = useMemo(() => chartEventsOf(result), [result]);

  const toggleLayer = (id: ChartSourceId) => {
    const isHidden = hidden.has(id);
    const next = new Set(hidden);
    if (isHidden) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setHidden(next);
    setAnnouncement(
      intl.formatMessage(
        {
          id: isHidden
            ? 'futureMe.result.chart.announce.shown'
            : 'futureMe.result.chart.announce.hidden',
        },
        { layer: intl.formatMessage({ id: SOURCE_LABELS[id] }) },
      ),
    );
  };

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
      <IncomeChart rows={rows} events={events} hidden={hidden} announce={setAnnouncement} />
      <Legend rows={rows} hidden={hidden} onToggle={toggleLayer} />
      <p role="status" className="visually-hidden">
        {announcement}
      </p>
    </figure>
  );
};
