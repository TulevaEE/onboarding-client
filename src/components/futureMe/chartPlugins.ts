import { Chart, ChartType, Plugin } from 'chart.js';

export interface CostsPoint {
  age: number;
  amount: number;
}

export interface CostsLineOptions {
  points: CostsPoint[];
  label: string;
}

export interface ChartMark {
  age: number;
  text: string;
}

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- chart.js declares this interface generic
  interface PluginOptionsByType<TType extends ChartType> {
    costs?: CostsLineOptions;
    marks?: ChartMark[];
  }
}

export const COSTS_COLOR = '#db2200';
const LABEL_TEXT_COLOR = '#fff';
const MARK_LINE_COLOR = 'rgba(33, 37, 41, 0.3)';
const MARK_PILL = { background: '#edf7fd', text: '#002f63', border: '#c9e0ee' };
const PILL_FONT = '700 12px Roboto, sans-serif';
const PILL_HEIGHT = 20;
const PILL_PADDING = 8;
const MARK_PILL_GAP = 6;
const MARK_PILL_ROW_HEIGHT = 24;
const MARK_PILL_CLEARANCE = 4;

interface PillColors {
  background: string;
  text: string;
  border?: string;
}

const pillWidthOf = (ctx: CanvasRenderingContext2D, text: string) => {
  ctx.save();
  ctx.font = PILL_FONT;
  const width = Math.ceil(ctx.measureText(text).width) + 2 * PILL_PADDING;
  ctx.restore();
  return width;
};

const tracePill = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
  const canRoundCorners = typeof ctx.roundRect === 'function';
  if (canRoundCorners) {
    ctx.roundRect(x, y, width, PILL_HEIGHT, PILL_HEIGHT / 2);
  } else {
    ctx.rect(x, y, width, PILL_HEIGHT);
  }
};

const drawPill = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  colors: PillColors,
) => {
  ctx.save();
  ctx.font = PILL_FONT;
  ctx.beginPath();
  tracePill(ctx, x, y, pillWidthOf(ctx, text));
  ctx.fillStyle = colors.background;
  ctx.fill();
  if (colors.border) {
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = colors.text;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + PILL_PADDING, y + PILL_HEIGHT / 2);
  ctx.restore();
};

interface PillBox {
  left: number;
  right: number;
  top: number;
}

const costsY = (chart: Chart<'line'>, amount: number) => chart.scales.y.getPixelForValue(amount);

const costsX = (chart: Chart<'line'>, { age }: CostsPoint) => chart.scales.x.getPixelForValue(age);

const costsPillBox = (
  chart: Chart<'line'>,
  { points }: CostsLineOptions,
  width: number,
): PillBox => {
  const left = costsX(chart, points[0]) + MARK_PILL_GAP;
  return { left, right: left + width, top: costsY(chart, points[0].amount) - PILL_HEIGHT / 2 };
};

const overlapsPill = (taken: PillBox[], left: number, right: number, top: number) =>
  taken.some(
    (box) =>
      left < box.right + MARK_PILL_GAP &&
      right > box.left - MARK_PILL_GAP &&
      top < box.top + MARK_PILL_ROW_HEIGHT &&
      top + PILL_HEIGHT > box.top - MARK_PILL_CLEARANCE,
  );

const freeTop = (taken: PillBox[], left: number, right: number, first: number, limit: number) => {
  let top = first;
  while (overlapsPill(taken, left, right, top) && top < limit) {
    top += MARK_PILL_ROW_HEIGHT;
  }
  return top;
};

export const costsLine: Plugin<'line', CostsLineOptions> = {
  id: 'costs',
  afterDatasetsDraw(chart, _args, options: CostsLineOptions) {
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = COSTS_COLOR;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    options.points.forEach((point, index) => {
      const place = [costsX(chart, point), costsY(chart, point.amount)] as const;
      if (index === 0) {
        ctx.moveTo(...place);
      } else {
        ctx.lineTo(...place);
      }
    });
    ctx.stroke();
    ctx.restore();
    const { left, top } = costsPillBox(chart, options, 0);
    drawPill(ctx, left, top, options.label, { background: COSTS_COLOR, text: LABEL_TEXT_COLOR });
  },
};

export const marksLine: Plugin<'line', ChartMark[]> = {
  id: 'marks',
  afterDatasetsDraw(chart, _args, marks: ChartMark[] = []) {
    const { ctx, chartArea, scales } = chart;
    const costs = chart.options.plugins?.costs as CostsLineOptions | undefined;
    const taken: PillBox[] = costs
      ? [costsPillBox(chart, costs, pillWidthOf(ctx, costs.label))]
      : [];
    marks.forEach(({ age, text }) => {
      if (age < scales.x.min || age > scales.x.max) {
        return;
      }
      const x = scales.x.getPixelForValue(age);
      ctx.save();
      ctx.strokeStyle = MARK_LINE_COLOR;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
      const width = pillWidthOf(ctx, text);
      const left = x + 4 + width > chartArea.right ? x - 4 - width : x + 4;
      const limit = chartArea.bottom - MARK_PILL_ROW_HEIGHT;
      const top = freeTop(taken, left, left + width, chartArea.top + 2, limit);
      taken.push({ left, right: left + width, top });
      drawPill(ctx, left, top, text, MARK_PILL);
    });
  },
};
