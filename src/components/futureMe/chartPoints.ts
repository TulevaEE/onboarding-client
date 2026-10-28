import { ChartRow, ChartSourceId, SOURCE_IDS } from './chartData';

type Values = Record<ChartSourceId, number>;

export interface ChartPoint {
  age: number;
  rowIndex: number;
  isCarry: boolean;
  values: Values;
}

export interface Cover {
  shortfall: number;
  surplus: number;
  without: ChartSourceId[];
}

const NOTICEABLE = 0.5;

const valuesOf = (row: ChartRow): Values =>
  Object.fromEntries(SOURCE_IDS.map((id) => [id, row[id]])) as Values;

const startsOrStops = (id: ChartSourceId, before: ChartRow, row: ChartRow) =>
  before[id] > 0 !== row[id] > 0;

export const chartPointsOf = (rows: ChartRow[]): ChartPoint[] =>
  rows.flatMap((row, rowIndex) => {
    const point: ChartPoint = { age: row.age, rowIndex, isCarry: false, values: valuesOf(row) };
    const before = rows[rowIndex - 1];
    const isTurning = before && SOURCE_IDS.some((id) => startsOrStops(id, before, row));
    return isTurning ? [{ ...point, isCarry: true, values: valuesOf(before) }, point] : [point];
  });

const totalOf = (point: ChartPoint, layers: ChartSourceId[]) =>
  layers.reduce((sum, id) => sum + point.values[id], 0);

export const stackedValueOf = (point: ChartPoint, visible: ChartSourceId[], id: ChartSourceId) =>
  totalOf(point, visible.slice(0, visible.indexOf(id) + 1));

export const isLayerEdgeHidden = (
  point: ChartPoint,
  costs: number,
  visible: ChartSourceId[],
  id: ChartSourceId,
) => {
  const above = visible.slice(visible.indexOf(id) + 1);
  const isTop = point.values[id] > 0 && above.every((other) => point.values[other] === 0);
  const paying = visible.filter((other) => point.values[other] > 0).length;
  const roundingError = (paying + 1) / 2;
  return isTop && Math.abs(totalOf(point, visible) - costs) <= roundingError;
};

export const coverOf = (
  row: ChartRow,
  layers: ChartSourceId[],
  hidden: ReadonlySet<ChartSourceId>,
): Cover => {
  const without = layers.filter((id) => hidden.has(id) && row[id] > 0);
  if (without.length === 0) {
    return { shortfall: row.shortfall, surplus: row.surplus, without };
  }
  const shown = layers.filter((id) => !hidden.has(id)).reduce((sum, id) => sum + row[id], 0);
  const gap = row.costs - shown;
  const isWorking = row.salary > 0;
  return {
    shortfall: Math.max(row.shortfall, gap > NOTICEABLE ? Math.round(gap) : 0),
    surplus: !isWorking && -gap > NOTICEABLE ? Math.round(-gap) : 0,
    without,
  };
};
