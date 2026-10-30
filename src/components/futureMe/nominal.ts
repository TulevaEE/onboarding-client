import { CURRENT_YEAR, INFLATION, SimulationRow } from './engine/pension';
import { Result } from './resultAnswers';

type Amount = Exclude<
  {
    [Field in keyof SimulationRow]: SimulationRow[Field] extends number ? Field : never;
  }[keyof SimulationRow],
  'age' | 'year' | 'alive' | 'pot' | 'deposit'
>;

const AMOUNT_FIELDS: Amount[] = [
  'i1',
  'i1g',
  'tax1',
  'isp',
  'ispg',
  'taxSp',
  'i23',
  'i2',
  'i3',
  'fp',
  'extra',
  'extra2',
  'dep',
  'spend',
  'shortfall',
  'moneyLeft',
];

export const nominalFactorAt = (year: number): number => (1 + INFLATION) ** (year - CURRENT_YEAR);

const nominalRowOf = (row: SimulationRow): SimulationRow => {
  const factor = nominalFactorAt(row.year);
  return AMOUNT_FIELDS.reduce(
    (scaled, field) => ({ ...scaled, [field]: row[field] * factor }),
    row,
  );
};

const nominalFirstPillarOf = ({ firstPillar, rows, pensionStartAge, p1StartAge }: Result) => {
  if (!firstPillar || rows.length === 0) {
    return firstPillar;
  }
  const factorAt = (age: number) => nominalFactorAt(rows[0].year - rows[0].age + age);
  const { atPa } = firstPillar;
  return {
    ...firstPillar,
    special: firstPillar.special * factorAt(atPa?.age ?? pensionStartAge),
    oldAge: firstPillar.oldAge * factorAt(p1StartAge),
    atPa: atPa && { ...atPa, oldAge: atPa.oldAge * factorAt(atPa.age) },
  };
};

export const nominalResultOf = (result: Result): Result => ({
  ...result,
  rows: result.rows.map(nominalRowOf),
  earlyThirdPillar: result.earlyThirdPillar.map((payment) => ({
    ...payment,
    amount: payment.amount * nominalFactorAt(payment.year),
  })),
  firstPillar: nominalFirstPillarOf(result),
});
