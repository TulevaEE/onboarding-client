import { ChartRow } from './chartData';
import { ChartEvent, FundPillars } from './chartEvents';
import { SimulationRow } from './engine/pension';
import { Result } from './resultAnswers';

type Pillar = 'second' | 'third';

export type StatePensionRiseReason = 'allowance' | 'work' | 'recalculated';
export type WithdrawalEndReason = 'empty' | 'covered';

export type ChartChange =
  | { kind: 'workEnd'; age: number }
  | { kind: 'statePensionStart'; age: number }
  | { kind: 'rescueAllowanceEnd'; age: number }
  | { kind: 'statePensionRise'; age: number; reason: StatePensionRiseReason; amount: number }
  | { kind: 'fundStart'; age: number }
  | { kind: 'fundEnd'; age: number; pillars: FundPillars; years: number }
  | { kind: 'withdrawalStart'; age: number; pillar: Pillar }
  | { kind: 'withdrawalEnd'; age: number; pillar: Pillar; reason: WithdrawalEndReason }
  | { kind: 'depositStart'; age: number }
  | { kind: 'moneyEnd'; age: number };

const NOTICEABLE_RISE = 1;
const HAS_MONEY = 1;
const SAME_GROSS = 0.5;

const TAXED_LAYER: Record<Pillar, 'secondPillarTaxed' | 'thirdPillarTaxed'> = {
  second: 'secondPillarTaxed',
  third: 'thirdPillarTaxed',
};
const POT: Record<Pillar, 'pot2' | 'pot3'> = { second: 'pot2', third: 'pot3' };

const KIND_ORDER: ChartChange['kind'][] = [
  'workEnd',
  'statePensionStart',
  'rescueAllowanceEnd',
  'statePensionRise',
  'fundStart',
  'fundEnd',
  'withdrawalEnd',
  'withdrawalStart',
  'depositStart',
  'moneyEnd',
];

const changesFromEvents = (events: ChartEvent[]): ChartChange[] =>
  events.flatMap((event): ChartChange[] => {
    switch (event.kind) {
      case 'workEnd':
      case 'fundStart':
      case 'depositStart':
      case 'moneyEnd':
        return [{ kind: event.kind, age: event.age }];
      case 'statePension':
        return [{ kind: 'statePensionStart', age: event.age }];
      case 'fundEnd':
        return event.pillars && event.years
          ? [{ kind: 'fundEnd', age: event.age, pillars: event.pillars, years: event.years }]
          : [];
      default:
        return [];
    }
  });

const pairsOf = <T>(items: T[]): [T, T][] =>
  items.slice(1).map((item, index) => [items[index], item]);

const statePensionRises = (rows: SimulationRow[]): ChartChange[] => {
  const retired = rows.filter(({ work }) => !work);
  const hasWorked = rows.some(({ work }) => work);
  return pairsOf(retired).flatMap(([before, row]): ChartChange[] => {
    const rise = row.i1 - before.i1;
    if (before.i1 <= 0 || rise < NOTICEABLE_RISE || row.age !== before.age + 1) {
      return [];
    }
    let reason: StatePensionRiseReason = 'recalculated';
    if (Math.abs(row.i1g - before.i1g) < SAME_GROSS) {
      reason = 'allowance';
    } else if (hasWorked) {
      reason = 'work';
    }
    return [{ kind: 'statePensionRise', age: row.age, reason, amount: rise }];
  });
};

const withdrawalChanges = (
  rows: ChartRow[],
  resultRowAt: (age: number) => SimulationRow | undefined,
  pillar: Pillar,
): ChartChange[] => {
  const layer = TAXED_LAYER[pillar];
  return pairsOf(rows).flatMap(([before, row]): ChartChange[] => {
    if (before[layer] === 0 && row[layer] > 0) {
      return [{ kind: 'withdrawalStart', age: row.age, pillar }];
    }
    if (before[layer] > 0 && row[layer] === 0) {
      let reason: WithdrawalEndReason = 'covered';
      if ((resultRowAt(row.age)?.[POT[pillar]] ?? 0) < HAS_MONEY) {
        reason = 'empty';
      }
      return [{ kind: 'withdrawalEnd', age: row.age, pillar, reason }];
    }
    return [];
  });
};

const firstWithdrawalAt = (rows: ChartRow[]): ChartChange[] => {
  const [first] = rows;
  if (!first) {
    return [];
  }
  return (['second', 'third'] as const)
    .filter((pillar) => first[TAXED_LAYER[pillar]] > 0)
    .map((pillar) => ({ kind: 'withdrawalStart', age: first.age, pillar }));
};

export const chartChangesOf = (
  result: Result,
  chartRows: ChartRow[],
  events: ChartEvent[],
): ChartChange[] => {
  const rows = chartRows.filter(({ isBeforePension }) => !isBeforePension);
  const resultRows = result.rows.filter(({ age }) => age >= result.pensionStartAge);
  const resultRowAt = (age: number) => resultRows.find((row) => row.age === age);
  const lastAge = rows[rows.length - 1]?.age ?? result.pensionStartAge;
  const allowanceEnd = result.rescueAllowance?.until;
  const changes: ChartChange[] = [
    ...changesFromEvents(events),
    ...(allowanceEnd !== undefined && allowanceEnd <= lastAge
      ? [{ kind: 'rescueAllowanceEnd' as const, age: allowanceEnd }]
      : []),
    ...statePensionRises(resultRows),
    ...firstWithdrawalAt(rows),
    ...withdrawalChanges(rows, resultRowAt, 'second'),
    ...withdrawalChanges(rows, resultRowAt, 'third'),
  ];
  return changes.sort(
    (a, b) => a.age - b.age || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
};
