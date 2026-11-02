import { Chart, ChartEvent, InteractionOptions } from 'chart.js';
import { ChartMark, costsLine, CostsLineOptions, lastPointAtAge, marksLine } from './chartPlugins';

const PILL_TEXT_WIDTH = 40;
const PILL_WIDTH = PILL_TEXT_WIDTH + 16;
const CHART_TOP = 10;

const flatCosts = (amount: number) => ({
  points: [
    { age: 65, amount },
    { age: 94, amount },
  ],
  label: 'Kulud',
});

const fakeChart = (
  overrides: Record<string, unknown> = {},
  costsOptions: CostsLineOptions = flatCosts(800),
) => {
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
    options: { plugins: { costs: costsOptions } },
    scales: {
      x: { min: 65, max: 94, getPixelForValue: (age: number) => (age - 65) * 10 },
      y: { getPixelForValue: (amount: number) => 210 - amount / 10 },
    },
  };
  return { ctx, chart: chart as unknown as Chart<'line'> };
};

const drawMarks = (marks: ChartMark[], costs?: CostsLineOptions) => {
  const { ctx, chart } = fakeChart({}, costs);
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

    it('draws the line and the pill edge in a darker colour in high contrast', () => {
      const strokeColors: string[] = [];
      const { ctx, chart } = fakeChart();
      Object.defineProperty(ctx, 'strokeStyle', { set: (color) => strokeColors.push(color) });
      const strokesOfMark = () => {
        strokeColors.length = 0;
        marksLine.afterDatasetsDraw?.(chart, {} as never, [{ age: 70, text: 'Töö lõpp' }], false);
        return [...strokeColors];
      };
      const normal = strokesOfMark();

      document.documentElement.classList.add('high-contrast');
      const highContrast = strokesOfMark();
      document.documentElement.classList.remove('high-contrast');

      expect(normal).toHaveLength(2);
      expect(highContrast).toEqual(['#6b7074', '#6b7074']);
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

    it('moves a pill off every pill drawn before it, not only the last one', () => {
      const { ctx, chart } = fakeChart({
        measureText: jest.fn((text: string) => ({ width: text.length * 5 })),
      });

      marksLine.afterDatasetsDraw?.(
        chart,
        {} as never,
        [
          { age: 65, text: 'Fondipension lõpeb' },
          { age: 67, text: 'Töö' },
          { age: 72, text: 'Raha' },
        ],
        false,
      );

      expect(pillAt(ctx, 2).y).toBe(CHART_TOP + 2 + 24);
    });

    it('puts a pill back on the top row once it is clear of the pills there', () => {
      const ctx = drawMarks([
        { age: 65, text: 'Pension 65' },
        { age: 69, text: 'Töö lõpp' },
        { age: 72, text: 'Raha otsas' },
      ]);

      expect(pillAt(ctx, 1).y).toBe(CHART_TOP + 2 + 24);
      expect(pillAt(ctx, 2).y).toBe(CHART_TOP + 2);
    });

    it('moves a pill that would sit on the costs label', () => {
      const ctx = drawMarks([{ age: 65, text: 'Pension 65' }], flatCosts(2000));

      expect(pillAt(ctx, 0).y).toBe(CHART_TOP + 2 + 24);
    });

    it('places the pills on a chart without a costs line', () => {
      const { ctx, chart } = fakeChart();
      const withoutCosts = { ...chart, options: { plugins: {} } } as unknown as Chart<'line'>;

      marksLine.afterDatasetsDraw?.(
        withoutCosts,
        {} as never,
        [{ age: 65, text: 'Pension 65' }],
        false,
      );

      expect(pillAt(ctx, 0).y).toBe(CHART_TOP + 2);
    });

    it('keeps a pill where the costs label is far away', () => {
      const ctx = drawMarks([{ age: 65, text: 'Pension 65' }]);

      expect(pillAt(ctx, 0).y).toBe(CHART_TOP + 2);
    });

    it('draws nothing without marks', () => {
      const { ctx, chart } = fakeChart();

      marksLine.afterDatasetsDraw?.(chart, {} as never, undefined as never, false);

      expect(ctx.stroke).not.toHaveBeenCalled();
    });
  });

  describe('the points under the pointer', () => {
    const AGES_WITH_WORK_END_AT_68 = [67, 68, 68, 69];
    const pointAt = (age: number) => {
      const place = { x: (age - 65) * 10, y: 100 };
      return { ...place, skip: false, inRange: () => false, getCenterPoint: () => place };
    };
    const layerAt = (index: number) => ({
      index,
      data: AGES_WITH_WORK_END_AT_68.map(pointAt),
      _sorted: true,
      controller: { _cachedMeta: { iScale: { axis: 'x' } } },
    });
    const layers = [layerAt(0), layerAt(1)];
    const chart = {
      isPointInArea: () => true,
      getSortedVisibleDatasetMetas: () => layers,
      getDatasetMeta: (index: number) => layers[index],
    } as unknown as Chart;
    const pointsUnder = (x: number) =>
      lastPointAtAge(
        chart,
        { native: {}, x, y: 100 } as unknown as ChartEvent,
        { intersect: false } as InteractionOptions,
      );

    it('picks the point of the age on both sides of a vertical line, not its extra point', () => {
      const rowPoints = layers.map(({ index, data }) => ({
        datasetIndex: index,
        index: 2,
        element: data[2],
      }));

      expect(pointsUnder(28)).toEqual(rowPoints);
      expect(pointsUnder(32)).toEqual(rowPoints);
    });

    it('picks the point of an age without a vertical line', () => {
      expect(pointsUnder(21).map(({ index }) => index)).toEqual([0, 0]);
    });
  });

  describe('costs', () => {
    const options = flatCosts(800);

    it('draws the costs as a dotted line over the layers, without a white edge', () => {
      const { ctx, chart } = fakeChart();

      costsLine.afterDatasetsDraw?.(chart, {} as never, options, false);

      expect(costsLine.beforeDatasetsDraw).toBeUndefined();
      expect(ctx.moveTo).toHaveBeenCalledWith(0, 130);
      expect(ctx.lineTo.mock.calls).toEqual([[290, 130]]);
      expect(ctx.setLineDash.mock.calls).toEqual([[[2, 6]]]);
    });

    it('follows the costs age by age when they change', () => {
      const { ctx, chart } = fakeChart();
      const rising = {
        ...options,
        points: [
          { age: 65, amount: 800 },
          { age: 66, amount: 900 },
          { age: 67, amount: 1000 },
        ],
      };

      costsLine.afterDatasetsDraw?.(chart, {} as never, rising, false);

      expect(ctx.moveTo).toHaveBeenCalledWith(0, 130);
      expect(ctx.lineTo.mock.calls).toEqual([
        [10, 120],
        [20, 110],
      ]);
    });

    it('starts the costs line and its label at the first age with costs', () => {
      const { ctx, chart } = fakeChart();
      const fromPensionAge = {
        ...options,
        points: [
          { age: 67, amount: 800 },
          { age: 68, amount: 800 },
        ],
      };

      costsLine.afterDatasetsDraw?.(chart, {} as never, fromPensionAge, false);

      expect(ctx.moveTo).toHaveBeenCalledWith(20, 130);
      expect(ctx.lineTo).toHaveBeenCalledWith(30, 130);
      expect(pillAt(ctx, 0)).toEqual({ x: 26, y: 120 });
    });

    it('labels the costs line with a red pill at its start', () => {
      const { ctx, chart } = fakeChart();

      costsLine.afterDatasetsDraw?.(
        chart,
        {} as never,
        { ...options, label: 'Kulud: 800 €' },
        false,
      );

      expect(ctx.fillText).toHaveBeenCalledWith('Kulud: 800 €', 14, 130);
      expect(pillAt(ctx, 0)).toEqual({ x: 6, y: 120 });
    });
  });
});
