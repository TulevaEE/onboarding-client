import { SimulationRow } from './engine/pension';
import { nominalFactorAt } from './nominal';
import { Result } from './resultAnswers';

export type ChartSourceId =
  | 'salary'
  | 'firstPillar'
  | 'specialPension'
  | 'secondPillar'
  | 'secondPillarTaxed'
  | 'thirdPillar'
  | 'thirdPillarTaxed'
  | 'deposit';

export interface ChartRow {
  age: number;
  year: number;
  salary: number;
  firstPillar: number;
  specialPension: number;
  secondPillar: number;
  secondPillarTaxed: number;
  thirdPillar: number;
  thirdPillarTaxed: number;
  deposit: number;
  costs: number;
  shortfall: number;
  surplus: number;
  isBeforePension: boolean;
}

export const SOURCE_IDS: ChartSourceId[] = [
  'salary',
  'firstPillar',
  'specialPension',
  'thirdPillar',
  'thirdPillarTaxed',
  'secondPillar',
  'secondPillarTaxed',
  'deposit',
];
const TABLE_AGE_STEP = 5;
const NOTICEABLE = 0.5;

const surplusOf = ({ work, i1, isp, i2, i3, dep }: SimulationRow, need: number) => {
  const over = i1 + isp + i2 + i3 + dep - need;
  return !work && over > NOTICEABLE ? Math.round(over) : 0;
};

const beforePensionRowOf = (
  age: number,
  year: number,
  amounts: Partial<Pick<ChartRow, 'specialPension' | 'thirdPillar'>>,
): ChartRow => ({
  age,
  year,
  salary: 0,
  firstPillar: 0,
  specialPension: 0,
  secondPillar: 0,
  secondPillarTaxed: 0,
  thirdPillar: 0,
  thirdPillarTaxed: 0,
  deposit: 0,
  costs: 0,
  shortfall: 0,
  surplus: 0,
  isBeforePension: true,
  ...amounts,
});

const specialPensionStartAgeOf = ({ rows }: Result): number =>
  rows.find(({ isp }) => isp > NOTICEABLE)?.age ?? Infinity;

const beforePensionRowsOf = (result: Result): ChartRow[] => {
  const specialPensionFrom = specialPensionStartAgeOf(result);
  const isBeforePensionAge = ({ age }: { age: number }) => age < result.pensionStartAge;
  const fundPensions = result.earlyThirdPillar.filter(isBeforePensionAge);
  const ages = new Set([
    ...fundPensions.map(({ age }) => age),
    ...result.rows
      .filter((row) => isBeforePensionAge(row) && row.age >= specialPensionFrom)
      .map(({ age }) => age),
  ]);
  return Array.from(ages)
    .sort((a, b) => a - b)
    .map((age) => {
      const resultRow = result.rows.find((row) => row.age === age);
      const fundPension = fundPensions.find((payment) => payment.age === age);
      return beforePensionRowOf(age, fundPension?.year ?? resultRow?.year ?? 0, {
        specialPension: age >= specialPensionFrom ? Math.round(resultRow?.isp ?? 0) : 0,
        thirdPillar: Math.round(fundPension?.amount ?? 0),
      });
    });
};

export const chartRowsOf = (result: Result, need: number, isNominal = false): ChartRow[] => {
  const isBeforePensionAge = ({ age }: { age: number }) => age < result.pensionStartAge;
  const fundPensionFrom55At = (age: number) =>
    result.earlyThirdPillar.find((payment) => payment.age === age)?.amount ?? 0;
  return [
    ...beforePensionRowsOf(result),
    ...result.rows
      .filter((row) => !isBeforePensionAge(row))
      .map((row) => {
        const costs = isNominal ? need * nominalFactorAt(row.year) : need;
        const thirdPillarTaken = row.extra - row.extra2;
        return {
          age: row.age,
          year: row.year,
          salary: row.work ? Math.round(row.spend) : 0,
          firstPillar: row.work ? 0 : Math.round(row.i1),
          specialPension: row.work ? 0 : Math.round(row.isp),
          secondPillar: Math.round(row.i2 - row.extra2),
          secondPillarTaxed: Math.round(row.extra2),
          thirdPillar: Math.round(
            Math.max(0, row.i3 - thirdPillarTaken) + fundPensionFrom55At(row.age),
          ),
          thirdPillarTaxed: Math.round(thirdPillarTaken),
          deposit: Math.round(row.dep),
          costs: Math.round(costs),
          shortfall: row.shortfall > NOTICEABLE ? Math.round(row.shortfall) : 0,
          surplus: surplusOf(row, costs),
          isBeforePension: false,
        };
      }),
  ];
};

export const pensionStartRowOf = (rows: ChartRow[]): ChartRow =>
  rows.find(({ isBeforePension }) => !isBeforePension) ?? rows[0];

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
  const pensionStart = pensionStartRowOf(rows);
  return rows.filter(
    (row, index) =>
      index === 0 || row === pensionStart || row === workEnd || row.age % TABLE_AGE_STEP === 0,
  );
};
