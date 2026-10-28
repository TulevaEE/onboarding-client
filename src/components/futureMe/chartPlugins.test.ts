import { Chart } from 'chart.js';
import { ChartMark, costsLine, marksLine } from './chartPlugins';

const PILL_TEXT_WIDTH = 40;
const PILL_WIDTH = PILL_TEXT_WIDTH + 16;
const CHART_TOP = 10;

const fakeChart = (overrides: Record<string, unknown> = {}) => {
  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillText: jest.fn(),
    roundRect: jest.fn(),
    setLineDash: jest.fn(),
    measureText: jest.fn(() => ({ width: PILL_TEXT_WIDTH })),
    rect: jest.fn(),
    ...overrides,
  };
  const chart = {
    ctx,
    chartArea: { top: CHART_TOP, bottom: 210, left: 0, right: 300 },
    data: { labels: Array.from({ length: 30 }, (_, index) => 65 + index) },
    scales: {
      x: { getPixelForValue: (index: number) => index * 10 },
      y: { getPixelForValue: (amount: number) => 210 - amount / 10 },
    },
  };
  return { ctx, chart: chart as unknown as Chart<'line'> };
};

const drawMarks = (marks: ChartMark[]) => {
  const { ctx, chart } = fakeChart();
  marksLine.afterDatasetsDraw?.(chart, {} as never, marks, false);
  return ctx;
};

const pillAt = (ctx: ReturnType<typeof fakeChart>['ctx'], call: number) => {
  const [x, y] = ctx.roundRect.mock.calls[call];
  return { x, y };
};

describe('chartPlugins', () => {
  describe('marks', () => {
    it('draws a vertical line and a labelled pill at the age of a mark', () => {
      const ctx = drawMarks([{ age: 70, text: 'Töö lõpp' }]);

      expect(ctx.moveTo).toHaveBeenCalledWith(50, CHART_TOP);
      expect(ctx.lineTo).toHaveBeenCalledWith(50, 210);
      expect(ctx.fillText).toHaveBeenCalledWith('Töö lõpp', 62, expect.any(Number));
      expect(pillAt(ctx, 0)).toEqual({ x: 54, y: CHART_TOP + 2 });
    });

    it('draws the pill with square corners in a browser that cannot round them', () => {
      const { ctx, chart } = fakeChart({ roundRect: undefined });

      marksLine.afterDatasetsDraw?.(chart, {} as never, [{ age: 70, text: 'Töö lõpp' }], false);

      expect(ctx.rect).toHaveBeenCalledWith(54, CHART_TOP + 2, PILL_WIDTH, 20);
      expect(ctx.fillText).toHaveBeenCalledWith('Töö lõpp', 62, expect.any(Number));
    });

    it('skips a mark at an age the chart does not show', () => {
      const ctx = drawMarks([{ age: 120, text: 'Hiljem' }]);

      expect(ctx.stroke).not.toHaveBeenCalled();
      expect(ctx.fillText).not.toHaveBeenCalled();
    });

    it('puts the pill to the left of the line where it does not fit on the right', () => {
      const ctx = drawMarks([{ age: 94, text: 'Raha otsas' }]);

      expect(pillAt(ctx, 0).x).toBe(290 - 4 - PILL_WIDTH);
    });

    it('moves a pill that would overlap the one before it to the next row', () => {
      const ctx = drawMarks([
        { age: 65, text: 'Pension 65' },
        { age: 67, text: 'Töö lõpp' },
        { age: 80, text: 'Fondipension lõpeb' },
      ]);

      expect(pillAt(ctx, 1).y).toBe(CHART_TOP + 2 + 24);
      expect(pillAt(ctx, 2).y).toBe(CHART_TOP + 2);
    });

    it('draws nothing without marks', () => {
      const { ctx, chart } = fakeChart();

      marksLine.afterDatasetsDraw?.(chart, {} as never, undefined as never, false);

      expect(ctx.stroke).not.toHaveBeenCalled();
    });
  });

  describe('costs', () => {
    const options = { amount: 800, label: 'Kulud: 800 €' };

    it('draws the costs as a dotted line over a white edge at the height of the amount', () => {
      const { ctx, chart } = fakeChart();

      costsLine.beforeDatasetsDraw?.(chart, {} as never, options);

      expect(ctx.moveTo).toHaveBeenCalledWith(0, 130);
      expect(ctx.lineTo).toHaveBeenCalledWith(300, 130);
      expect(ctx.setLineDash.mock.calls).toEqual([[[]], [[2, 6]]]);
    });

    it('labels the costs line with a red pill at its start', () => {
      const { ctx, chart } = fakeChart();

      costsLine.afterDatasetsDraw?.(chart, {} as never, options, false);

      expect(ctx.fillText).toHaveBeenCalledWith('Kulud: 800 €', 14, 130);
      expect(pillAt(ctx, 0)).toEqual({ x: 6, y: 120 });
    });
  });
});
