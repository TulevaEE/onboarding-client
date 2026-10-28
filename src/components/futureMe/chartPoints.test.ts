import { ChartRow, ChartSourceId } from './chartData';
import { chartPointsOf, coverOf, isLayerEdgeHidden, stackedValueOf } from './chartPoints';

const rowWith = (changes: Partial<ChartRow>): ChartRow => ({
  age: 66,
  year: 2042,
  salary: 0,
  firstPillar: 0,
  specialPension: 0,
  secondPillar: 0,
  thirdPillar: 0,
  deposit: 0,
  costs: 1000,
  shortfall: 0,
  surplus: 0,
  isBeforePension: false,
  ...changes,
});

const LAYERS: ChartSourceId[] = ['salary', 'firstPillar', 'secondPillar', 'deposit'];
const hiding = (...ids: ChartSourceId[]) => new Set<ChartSourceId>(ids);

describe('chartPoints', () => {
  describe('points', () => {
    it('has one point per row while every source keeps its state', () => {
      const rows = [rowWith({ age: 66, firstPillar: 700 }), rowWith({ age: 67, firstPillar: 710 })];

      expect(
        chartPointsOf(rows).map(({ age, rowIndex, isCarry }) => ({ age, rowIndex, isCarry })),
      ).toEqual([
        { age: 66, rowIndex: 0, isCarry: false },
        { age: 67, rowIndex: 1, isCarry: false },
      ]);
    });

    it('ends a source with a vertical drop: an extra point at the same age keeps every source at the year before', () => {
      const rows = [
        rowWith({ age: 66, salary: 1000, secondPillar: 500 }),
        rowWith({ age: 67, salary: 0, secondPillar: 520 }),
      ];

      const [, carry, row] = chartPointsOf(rows);

      expect(carry).toMatchObject({ age: 67, rowIndex: 1, isCarry: true });
      expect(carry.values.salary).toBe(1000);
      expect(carry.values.secondPillar).toBe(500);
      expect(row.values.salary).toBe(0);
    });

    it('starts a source with a vertical rise from nothing', () => {
      const rows = [
        rowWith({ age: 66, firstPillar: 700 }),
        rowWith({ age: 67, firstPillar: 700, deposit: 50 }),
      ];

      const [, carry] = chartPointsOf(rows);

      expect(carry.values.deposit).toBe(0);
    });
  });

  describe('stacking', () => {
    const point = chartPointsOf([rowWith({ salary: 100, firstPillar: 200, secondPillar: 300 })])[0];

    it('adds up the visible layers up to and including the layer', () => {
      expect(stackedValueOf(point, LAYERS, 'secondPillar')).toBe(600);
    });

    it('does not count a layer that is not in the visible list', () => {
      expect(stackedValueOf(point, ['salary', 'secondPillar'], 'secondPillar')).toBe(400);
    });
  });

  describe('the top layer edge', () => {
    const layers = ['firstPillar', 'secondPillar'] as const;
    const hiddenAt = (row: ChartRow, id: (typeof layers)[number]) =>
      isLayerEdgeHidden(chartPointsOf([row])[0], row.costs, [...layers], id);

    it('is hidden where the visible layers add up to the costs', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 600 }), 'secondPillar')).toBe(true);
    });

    it('is hidden when the difference is less than a euro', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 600.4 }), 'secondPillar')).toBe(
        true,
      );
    });

    it('is hidden when rounding every layer to whole euros moved the sum by a euro', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 599 }), 'secondPillar')).toBe(true);
    });

    it('stays where the layers fall short of the costs', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 500 }), 'secondPillar')).toBe(
        false,
      );
    });

    it('stays where the layers are above the costs', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 700 }), 'secondPillar')).toBe(
        false,
      );
    });

    it('stays on a layer that is not the top one', () => {
      expect(hiddenAt(rowWith({ firstPillar: 400, secondPillar: 600 }), 'firstPillar')).toBe(false);
    });
  });

  describe('cover', () => {
    it('is what the engine found while every layer is shown', () => {
      const row = rowWith({ firstPillar: 700, shortfall: 300 });

      expect(coverOf(row, LAYERS, hiding())).toEqual({ shortfall: 300, surplus: 0, without: [] });
    });

    it('counts only the visible layers: what the hidden one paid is missing', () => {
      const row = rowWith({ firstPillar: 700, deposit: 300 });

      expect(coverOf(row, LAYERS, hiding('deposit'))).toEqual({
        shortfall: 300,
        surplus: 0,
        without: ['deposit'],
      });
    });

    it('shows what is left over from the visible layers only', () => {
      const row = rowWith({ firstPillar: 900, deposit: 500, surplus: 400 });

      expect(coverOf(row, LAYERS, hiding('deposit'))).toEqual({
        shortfall: 100,
        surplus: 0,
        without: ['deposit'],
      });
      expect(
        coverOf(
          rowWith({ firstPillar: 1200, deposit: 500, surplus: 700 }),
          LAYERS,
          hiding('deposit'),
        ),
      ).toMatchObject({
        surplus: 200,
      });
    });

    it('does not name a hidden layer that pays nothing at that age', () => {
      const row = rowWith({ firstPillar: 1000 });

      expect(coverOf(row, LAYERS, hiding('deposit')).without).toEqual([]);
    });

    it('leaves nothing over while the salary pays the costs, whichever layer is hidden', () => {
      const row = rowWith({ salary: 1000, firstPillar: 0, deposit: 100 });

      expect(coverOf(row, LAYERS, hiding('deposit')).surplus).toBe(0);
    });
  });
});
