import { SimulationRow } from './engine/pension';
import { nominalFactorAt } from './nominal';
import { Result } from './resultAnswers';

export type ChartSourceId =
  | 'salary'
  | 'firstPillar'
  | 'specialPension'
  | 'secondPillar'
  | 'thirdPillar'
  | 'deposit';

export interface ChartRow {
  age: number;
  year: number;
  salary: number;
  firstPillar: number;
  specialPension: number;
  secondPillar: number;
  thirdPillar: number;
  deposit: number;
  costs: number;
  shortfall: number;
  surplus: number;
}

const SOURCE_IDS: ChartSourceId[] = [
  'salary',
  'firstPillar',
  'specialPension',
  'secondPillar',
  'thirdPillar',
  'deposit',
];
const TABLE_AGE_STEP = 5;
const NOTICEABLE = 0.5;

const surplusOf = ({ work, i1, isp, i2, i3, dep }: SimulationRow, need: number) => {
  const over = i1 + isp + i2 + i3 + dep - need;
  return !work && over > NOTICEABLE ? Math.round(over) : 0;
};

export const chartRowsOf = (result: Result, need: number, isNominal = false): ChartRow[] =>
  result.rows
    .filter(({ age }) => age >= result.pensionStartAge)
    .map((row) => {
      const costs = isNominal ? need * nominalFactorAt(row.year) : need;
      return {
        age: row.age,
        year: row.year,
        salary: row.work ? Math.round(row.spend) : 0,
        firstPillar: row.work ? 0 : Math.round(row.i1),
        specialPension: row.work ? 0 : Math.round(row.isp),
        secondPillar: Math.round(row.i2),
        thirdPillar: Math.round(row.i3),
        deposit: Math.round(row.dep),
        costs: Math.round(costs),
        shortfall: row.shortfall > NOTICEABLE ? Math.round(row.shortfall) : 0,
        surplus: surplusOf(row, costs),
      };
    });

export const startSourcesOf = (start: ChartRow): ChartSourceId[] => {
  const paying = SOURCE_IDS.filter((id) => start[id] > 0);
  return paying.length > 0 ? paying : ['firstPillar'];
};

export const chartSeriesOf = (rows: ChartRow[]): { id: ChartSourceId; data: number[] }[] =>
  SOURCE_IDS.filter((id) => rows.some((row) => row[id] > 0)).map((id) => ({
    id,
    data: rows.map((row) => row[id]),
  }));

export const tableRowsOf = (rows: ChartRow[]): ChartRow[] => {
  const workEnd = rows.find((row, index) => index > 0 && rows[index - 1].salary > 0 && !row.salary);
  return rows.filter(
    (row, index) => index === 0 || row === workEnd || row.age % TABLE_AGE_STEP === 0,
  );
};
