import { Chart, ChartType, Plugin } from 'chart.js';

export interface CostsLineOptions {
  amount: number;
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
export const HALO_COLOR = '#fff';
const MARK_LINE_COLOR = 'rgba(33, 37, 41, 0.3)';
const MARK_PILL = { background: '#edf7fd', text: '#002f63', border: '#c9e0ee' };
const PILL_FONT = '700 12px Roboto, sans-serif';
const PILL_HEIGHT = 20;
const PILL_PADDING = 8;
const MARK_PILL_GAP = 6;
const MARK_PILL_ROW_HEIGHT = 24;

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
  ctx.roundRect(x, y, pillWidthOf(ctx, text), PILL_HEIGHT, PILL_HEIGHT / 2);
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

const costsY = (chart: Chart<'line'>, amount: number) => chart.scales.y.getPixelForValue(amount);

export const costsLine: Plugin<'line', CostsLineOptions> = {
  id: 'costs',
  beforeDatasetsDraw(chart, _args, options: CostsLineOptions) {
    const { ctx, chartArea } = chart;
    const y = costsY(chart, options.amount);
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
      chart.chartArea.left + MARK_PILL_GAP,
      costsY(chart, options.amount) - PILL_HEIGHT / 2,
      options.label,
      { background: COSTS_COLOR, text: HALO_COLOR },
    );
  },
};

export const marksLine: Plugin<'line', ChartMark[]> = {
  id: 'marks',
  afterDatasetsDraw(chart, _args, marks: ChartMark[] = []) {
    const { ctx, chartArea } = chart;
    const ages = chart.data.labels ?? [];
    let previousEnd = -Infinity;
    let row = 0;
    marks.forEach(({ age, text }) => {
      const index = ages.indexOf(age);
      if (index < 0) {
        return;
      }
      const x = chart.scales.x.getPixelForValue(index);
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
      row = left < previousEnd + MARK_PILL_GAP ? row + 1 : 0;
      drawPill(ctx, left, chartArea.top + 2 + row * MARK_PILL_ROW_HEIGHT, text, MARK_PILL);
      previousEnd = left + width;
    });
  },
};
