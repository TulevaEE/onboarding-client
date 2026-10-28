import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Filler,
  Interaction,
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
  pensionStartRowOf,
  startSourcesOf,
  tableRowsOf,
} from './chartData';
import { ageButtonsOf } from './chartAges';
import { ChartEvent, chartEventsOf } from './chartEvents';
import { assumptionOf, SummaryNote, summaryNotesOf } from './chartNotes';
import { ChartMark, costsLine, lastPointAtAge, marksLine } from './chartPlugins';
import {
  ChartPoint,
  chartPointsOf,
  coverOf,
  isLayerEdgeHidden,
  stackedValueOf,
} from './chartPoints';
import { SOURCE_COLORS, SOURCE_LABELS, SUMMARY_LABELS } from './chartSources';
import { announcementOf } from './chartText';
import { ResultChartAges } from './ResultChartAges';
import { ResultChartTip } from './ResultChartTip';
import { useTouchView } from './useTouchView';
import { ChartAssumption, ChartGuide, SummaryNotes } from './ResultChartNotes';
import { NominalChoice, NominalNote } from './ResultNominalChoice';
import { NominalReturns, nominalResultOf } from './nominal';

const HALO_COLOR = '#fff';
const TICK_COLOR = '#6b7074';
const AXIS_BORDER_COLOR = '#d9dee3';
const FONT = { size: 13 };
const NARROW_SCREEN = '(max-width: 575.98px)';
const WIDE_TICK_STEP = 5;
const NARROW_TICK_STEP = 10;
const DOT_EVERY_YEARS = 2;
const TOUCH_DOT_EVERY_YEARS = 5;
const DOT_RADIUS = 3;
const EVENT_DOT_RADIUS = 6;
const HOVER_RADIUS = 5;
const EVENT_HOVER_RADIUS = 8;
const EVENT_DOT_BORDER = 2;
const TIP_GAP = 10;
const Y_AXIS_WIDTH = 76;
const TOUCH_Y_AXIS_WIDTH = 52;
const MIN_TICK_GAP = 32;
const EVENT_DOT_ROOM = EVENT_DOT_RADIUS + EVENT_DOT_BORDER;
const THOUSAND = 1000;
const NOT_COUNTED = '–';
const COUNTED_FROM_PENSION_AGE: (ChartSourceId | 'costs')[] = ['salary', 'costs'];

ChartJS.register(LinearScale, LineController, LineElement, PointElement, Filler, Tooltip);
Interaction.modes.lastPointAtAge = lastPointAtAge;

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

const fittingTickStep = (width: number, years: number) =>
  (width / years) * WIDE_TICK_STEP >= MIN_TICK_GAP ? WIDE_TICK_STEP : NARROW_TICK_STEP;

const shortAmount = (value: number | string) => {
  const amount = Number(value);
  return amount >= THOUSAND
    ? `${(amount / THOUSAND).toLocaleString('et-EE', { maximumFractionDigits: 1 })} tuh`
    : String(amount);
};

const Summary = ({
  result,
  rows,
  notes,
  need,
  isNominal,
}: {
  result: Result;
  rows: ChartRow[];
  notes: SummaryNote[];
  need: number;
  isNominal: boolean;
}) => {
  const intl = useIntl();
  const start = pensionStartRowOf(rows);
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
      <SummaryNotes notes={notes} />
      <li>
        {isNominal ? (
          <FormattedMessage
            id="futureMe.result.chart.summary.costsNominal"
            values={{ today: euro(need), age: result.pensionStartAge, future: euro(start.costs) }}
          />
        ) : (
          <FormattedMessage
            id="futureMe.result.chart.summary.costs"
            values={{ amount: euro(start.costs) }}
          />
        )}
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

const dotRadiusOf = (age: number, isEvent: boolean, dotEvery: number) => {
  if (isEvent) {
    return EVENT_DOT_RADIUS;
  }
  return age % dotEvery === 0 ? DOT_RADIUS : 0;
};

const datasetsOf = (
  intl: IntlShape,
  rows: ChartRow[],
  points: ChartPoint[],
  layers: ChartSourceId[],
  hidden: ReadonlySet<ChartSourceId>,
  eventAges: ReadonlySet<number>,
  dotEvery: number,
): ChartData<'line'>['datasets'] => {
  const visible = layers.filter((id) => !hidden.has(id));
  let below: number | 'origin' = 'origin';
  return layers.map((id, index) => {
    const isHidden = hidden.has(id);
    const fill = isHidden ? false : below;
    if (!isHidden) {
      below = index;
    }
    const paysAt = (at: number) => points[at].values[id] > 0;
    const isEventAt = (at: number) => eventAges.has(points[at].age);
    const isUnderCostsLineAt = (at: number) =>
      !isHidden && isLayerEdgeHidden(points[at], rows[points[at].rowIndex].costs, visible, id);
    const isShownAt = (at: number) => paysAt(at) && !points[at].isCarry;
    const hasDotAt = (at: number) => isShownAt(at) && (isEventAt(at) || !isUnderCostsLineAt(at));
    const hideEdge = ({ p0DataIndex, p1DataIndex }: ScriptableLineSegmentContext) => {
      const paysNothing = !paysAt(p0DataIndex) && !paysAt(p1DataIndex);
      const isUnderCostsLine = isUnderCostsLineAt(p0DataIndex) && isUnderCostsLineAt(p1DataIndex);
      return paysNothing || isUnderCostsLine ? 'transparent' : undefined;
    };
    return {
      type: 'line' as const,
      label: intl.formatMessage({ id: SOURCE_LABELS[id] }),
      data: points.map((point) => ({
        x: point.age,
        y: isHidden ? 0 : stackedValueOf(point, visible, id),
      })),
      hidden: isHidden,
      fill,
      borderColor: SOURCE_COLORS[id],
      borderWidth: 1.5,
      backgroundColor: fadingFill(SOURCE_COLORS[id]),
      pointRadius: points.map((point, at) =>
        hasDotAt(at) ? dotRadiusOf(point.age, isEventAt(at), dotEvery) : 0,
      ),
      pointHoverRadius: points.map((_point, at) => {
        if (!isShownAt(at)) {
          return 0;
        }
        return isEventAt(at) ? EVENT_HOVER_RADIUS : HOVER_RADIUS;
      }),
      pointBackgroundColor: SOURCE_COLORS[id],
      pointBorderColor: HALO_COLOR,
      pointBorderWidth: points.map((_point, at) =>
        isShownAt(at) && isEventAt(at) ? EVENT_DOT_BORDER : 0,
      ),
      pointHoverBorderColor: HALO_COLOR,
      pointHoverBorderWidth: EVENT_DOT_BORDER,
      segment: { borderColor: hideEdge },
      tension: 0,
      clip: EVENT_DOT_ROOM,
    };
  });
};

const IncomeChart = ({ rows, events, hidden, announce }: IncomeChartProps) => {
  const intl = useIntl();
  const chartRef = useRef<ChartJS<'line'>>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const agesRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const isPressedWithMouse = useRef(false);
  const hasHighlight = useRef(false);
  const isTouchView = useTouchView();
  const [chartWidth, setChartWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const layers = useMemo(() => chartSeriesOf(rows).map(({ id }) => id), [rows]);
  const points = useMemo(() => chartPointsOf(rows), [rows]);
  const rowPointAt = (rowIndex: number) =>
    points.findIndex((point) => point.rowIndex === rowIndex && !point.isCarry);
  const visibleLayers = layers.filter((id) => !hidden.has(id));
  const eventAges = useMemo(() => new Set(events.map(({ age }) => age)), [events]);
  const ageButtons = useMemo(() => ageButtonsOf(rows, events), [rows, events]);
  const stops = useMemo(
    () =>
      rows.flatMap(({ age }, index) =>
        eventAges.has(age) || age % DOT_EVERY_YEARS === 0 ? [index] : [],
      ),
    [rows, eventAges],
  );

  const eventsAt = (index: number) => events.filter(({ age }) => age === rows[index].age);
  const close = () => setActiveIndex(null);
  const closeToAge = () => {
    agesRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    close();
  };
  const dismiss = isTouchView ? closeToAge : close;
  const goTo = (index: number) => {
    setActiveIndex(index);
    announce(
      announcementOf(
        intl,
        rows[index],
        eventsAt(index),
        visibleLayers,
        coverOf(rows[index], layers, hidden),
      ),
    );
  };

  const selectAge = (index: number) => (index === activeIndex ? close() : goTo(index));

  const isHeadingForTip = (x: number, index: number) => {
    const tip = tipRef.current;
    const chart = chartRef.current;
    if (!tip || !chart) {
      return false;
    }
    const lineX = chart.scales.x.getPixelForValue(rows[index].age);
    const tipRight = tip.offsetLeft + tip.offsetWidth;
    return tip.offsetLeft > lineX
      ? x > lineX && x < tip.offsetLeft + 2
      : x < lineX && x > tipRight - 2;
  };

  const { data, options } = useMemo(() => {
    const { costs } = pensionStartRowOf(rows);
    const isNarrow = window.matchMedia(NARROW_SCREEN).matches;
    let tickStep = isNarrow ? NARROW_TICK_STEP : WIDE_TICK_STEP;
    const chartData: ChartData<'line'> = {
      datasets: datasetsOf(
        intl,
        rows,
        points,
        layers,
        hidden,
        eventAges,
        isTouchView ? TOUCH_DOT_EVERY_YEARS : DOT_EVERY_YEARS,
      ),
    };
    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { left: EVENT_DOT_ROOM } },
      ...(isTouchView ? { events: [], onResize: (_chart, { width }) => setChartWidth(width) } : {}),
      interaction: { mode: 'lastPointAtAge', intersect: false },
      onHover: ({ x }, elements) => {
        const [element] = elements;
        if (!element) {
          return;
        }
        const shown = activeIndexRef.current;
        const isOnWayToTip = shown !== null && x !== null && isHeadingForTip(x, shown);
        if (!isOnWayToTip) {
          setActiveIndex(points[element.index].rowIndex);
        }
      },
      plugins: {
        datalabels: { display: false },
        legend: { display: false },
        tooltip: { enabled: false },
        marks: marksOf(intl, events),
        costs: {
          points: rows
            .filter((row) => !row.isBeforePension)
            .map((row) => ({ age: row.age, amount: row.costs })),
          label: intl.formatMessage(
            { id: 'futureMe.result.chart.costsLabel' },
            { amount: euro(costs) },
          ),
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: rows[0].age,
          max: rows[rows.length - 1].age,
          grid: { display: false },
          border: { color: AXIS_BORDER_COLOR },
          afterSetDimensions: ({ width }) => {
            if (isTouchView) {
              tickStep = fittingTickStep(width, rows.length);
            }
          },
          title: {
            display: !isTouchView,
            text: intl.formatMessage({ id: 'futureMe.result.chart.axis.age' }),
            color: TICK_COLOR,
            font: FONT,
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            stepSize: 1,
            color: TICK_COLOR,
            font: FONT,
            callback: (value) => (Number(value) % tickStep === 0 ? value : ''),
          },
        },
        y: {
          position: 'right',
          beginAtZero: true,
          suggestedMax: Math.max(...rows.map((row) => row.costs)),
          grace: '20%',
          border: { display: false },
          grid: { display: false },
          afterFit: (scale) => {
            // eslint-disable-next-line no-param-reassign
            scale.width = isTouchView ? TOUCH_Y_AXIS_WIDTH : Y_AXIS_WIDTH;
          },
          ticks: { maxTicksLimit: 5, color: TICK_COLOR, font: FONT, callback: shortAmount },
        },
      },
    };
    return { data: chartData, options: chartOptions };
  }, [intl, rows, points, events, layers, hidden, eventAges, isTouchView]);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    const tip = tipRef.current;
    const plot = plotRef.current;
    const crosshair = crosshairRef.current;
    if (activeIndex === null || !chart || !plot || !crosshair) {
      return;
    }
    const x = chart.scales.x.getPixelForValue(rows[activeIndex].age);
    const { top, bottom } = chart.chartArea;
    if (tip && !isTouchView) {
      const fitsRight = x + TIP_GAP + tip.offsetWidth <= plot.clientWidth;
      tip.style.left = `${Math.max(0, fitsRight ? x + TIP_GAP : x - TIP_GAP - tip.offsetWidth)}px`;
      tip.style.top = `${top}px`;
    }
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
              ? [{ datasetIndex, index: rowPointAt(activeIndex) }]
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
      const isInside = [plotRef, agesRef, tipRef].some((ref) =>
        ref.current?.contains(target as Node),
      );
      if (!isInside) {
        close();
      }
    };
    const closeOnEscape = ({ key }: KeyboardEvent) => {
      if (key === 'Escape') {
        dismiss();
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

  const keyboardProps = isTouchView
    ? {}
    : {
        tabIndex: 0,
        onKeyDown: moveWithKey,
        onFocus: focusFirstStop,
        onMouseDown: () => {
          isPressedWithMouse.current = true;
        },
        onMouseUp: () => {
          isPressedWithMouse.current = false;
        },
      };

  const tip = activeIndex !== null && (
    <ResultChartTip
      ref={tipRef}
      row={rows[activeIndex]}
      events={eventsAt(activeIndex)}
      layers={visibleLayers}
      cover={coverOf(rows[activeIndex], layers, hidden)}
      placement={isTouchView ? 'below' : 'floating'}
      onClose={dismiss}
    />
  );

  return (
    <>
      <p className="result-chart-unit text-secondary" aria-hidden="true">
        <FormattedMessage id="futureMe.result.chart.unit" />
      </p>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the chart inside takes the keys, this only closes the tooltip when the pointer or the focus leaves */}
      <div
        ref={plotRef}
        className="result-chart"
        onMouseLeave={isTouchView ? undefined : close}
        onBlur={isTouchView ? undefined : closeWhenFocusLeaves}
      >
        <Chart
          ref={chartRef}
          type="line"
          data={data}
          options={options}
          plugins={[costsLine, marksLine]}
          role="img"
          aria-labelledby="future-me-chart-title"
          aria-describedby={`future-me-chart-summary${isTouchView ? '' : ' future-me-chart-keys'}`}
          {...keyboardProps}
        />
        {activeIndex !== null && (
          <div ref={crosshairRef} className="result-chart-crosshair" aria-hidden="true" />
        )}
        {!isTouchView && tip}
      </div>
      {isTouchView ? (
        <>
          <ResultChartAges
            buttons={ageButtons}
            events={events}
            selected={activeIndex}
            chart={chartRef}
            chartWidth={chartWidth}
            toolbarRef={agesRef}
            onSelect={selectAge}
          />
          {tip}
        </>
      ) : (
        <p id="future-me-chart-keys" className="visually-hidden">
          <FormattedMessage id="futureMe.result.chart.keys" />
        </p>
      )}
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

const tableAmountOf = (row: ChartRow, id: ChartSourceId | 'costs') =>
  row.isBeforePension && COUNTED_FROM_PENSION_AGE.includes(id) ? NOT_COUNTED : euro(row[id]);

const IncomeTable = ({ rows, isNominal }: { rows: ChartRow[]; isNominal: boolean }) => {
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
          <FormattedMessage
            id={
              isNominal
                ? 'futureMe.result.chart.table.captionNominal'
                : 'futureMe.result.chart.table.caption'
            }
          />
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
                  {tableAmountOf(row, id)}
                </td>
              ))}
              <td className="text-end">{tableAmountOf(row, 'costs')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ResultChartProps {
  result: Result;
  need: number;
  nominalReturns: NominalReturns;
}

export const ResultChart = ({ result, need, nominalReturns }: ResultChartProps) => {
  const intl = useIntl();
  const [isTableShown, setTableShown] = useState(false);
  const [hidden, setHidden] = useState<ReadonlySet<ChartSourceId>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const [isNominal, setNominal] = useState(false);
  const shown = useMemo(() => (isNominal ? nominalResultOf(result) : result), [result, isNominal]);
  const rows = useMemo(() => chartRowsOf(shown, need, isNominal), [shown, need, isNominal]);
  const events = useMemo(() => chartEventsOf(result), [result]);
  const notes = useMemo(() => summaryNotesOf(shown, rows, isNominal), [shown, rows, isNominal]);
  const assumption = useMemo(
    () => assumptionOf(result, chartRowsOf(result, need), events),
    [result, need, events],
  );

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
        <NominalChoice isOn={isNominal} onChange={setNominal} />
      </div>
      <NominalNote isOn={isNominal} returns={nominalReturns} />
      <Summary result={shown} rows={rows} notes={notes} need={need} isNominal={isNominal} />
      {assumption && <ChartAssumption assumption={assumption} />}
      <ChartGuide events={events} startsBeforePension={rows[0].isBeforePension} />
      <button
        type="button"
        className="btn btn-outline-primary btn-sm result-chart-table-toggle"
        aria-expanded={isTableShown}
        aria-controls="future-me-chart-table"
        onClick={() => setTableShown(!isTableShown)}
      >
        <FormattedMessage
          id={
            isTableShown ? 'futureMe.result.chart.toggle.hide' : 'futureMe.result.chart.toggle.show'
          }
        />
      </button>
      <div id="future-me-chart-table">
        {isTableShown && <IncomeTable rows={rows} isNominal={isNominal} />}
      </div>
      <IncomeChart rows={rows} events={events} hidden={hidden} announce={setAnnouncement} />
      <Legend rows={rows} hidden={hidden} onToggle={toggleLayer} />
      <p role="status" className="visually-hidden">
        {announcement}
      </p>
    </figure>
  );
};
