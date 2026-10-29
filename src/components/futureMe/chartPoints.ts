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

const totalOf = (values: Values, layers: ChartSourceId[]) =>
  layers.reduce((sum, id) => sum + values[id], 0);

const roundingErrorOf = (values: Values, layers: ChartSourceId[]) =>
  (layers.filter((id) => values[id] > 0).length + 1) / 2;

export const stackedValueOf = (point: ChartPoint, visible: ChartSourceId[], id: ChartSourceId) =>
  totalOf(point.values, visible.slice(0, visible.indexOf(id) + 1));

export const isLayerEdgeHidden = (
  point: ChartPoint,
  costs: number,
  visible: ChartSourceId[],
  id: ChartSourceId,
) => {
  const above = visible.slice(visible.indexOf(id) + 1);
  const isTop = point.values[id] > 0 && above.every((other) => point.values[other] === 0);
  const difference = Math.abs(totalOf(point.values, visible) - costs);
  return isTop && difference <= roundingErrorOf(point.values, visible);
};

const isWorking = ({ salary }: ChartRow) => salary > 0;

const leftOverWithEveryLayerOf = (row: ChartRow, layers: ChartSourceId[]) => {
  const drawn = totalOf(row, layers) - row.costs;
  const found = row.shortfall > 0 ? -row.shortfall : row.surplus;
  const isOnlyRoundedApart = Math.abs(drawn - found) <= roundingErrorOf(row, layers);
  return isWorking(row) || isOnlyRoundedApart ? drawn : found;
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
  const leftOver = leftOverWithEveryLayerOf(row, layers) - totalOf(row, without);
  return {
    shortfall: -leftOver > NOTICEABLE ? Math.round(-leftOver) : 0,
    surplus: !isWorking(row) && leftOver > NOTICEABLE ? Math.round(leftOver) : 0,
    without,
  };
};
