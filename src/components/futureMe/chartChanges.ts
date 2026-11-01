import { ChartRow } from './chartData';
import { ChartEvent, FundPillars } from './chartEvents';
import { SimulationRow } from './engine/pension';
import { nominalFactorAt } from './nominal';
import { Result } from './resultAnswers';

type Pillar = 'second' | 'third';

export type StatePensionRiseReason = 'allowance' | 'recalculated';
export type WithdrawalEndReason = 'empty' | 'covered';

export type ChartChange =
  | { kind: 'workEnd'; age: number }
  | { kind: 'statePensionStart'; age: number }
  | { kind: 'rescueAllowanceEnd'; age: number; pensionStarts: boolean }
  | { kind: 'specialPensionStart'; age: number }
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
const SPECIAL_PAID = 0.5;
const STATE_PENSION_PAID = 0.5;

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
  'specialPensionStart',
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

const statePensionRises = (rows: SimulationRow[], isNominal: boolean): ChartChange[] => {
  const retired = rows.filter(({ work }) => !work);
  return pairsOf(retired).flatMap(([before, row]): ChartChange[] => {
    const rise = row.i1 - before.i1;
    if (row.age !== before.age + 1) {
      return [];
    }
    if (before.i1 <= 0 && row.i1 >= NOTICEABLE_RISE) {
      return [{ kind: 'statePensionStart', age: row.age }];
    }
    if (before.i1 <= 0 || rise < NOTICEABLE_RISE) {
      return [];
    }
    const reason: StatePensionRiseReason =
      Math.abs(row.i1g - before.i1g) < SAME_GROSS ? 'allowance' : 'recalculated';
    const amount = isNominal ? rise * nominalFactorAt(row.year) : rise;
    return [{ kind: 'statePensionRise', age: row.age, reason, amount }];
  });
};

const specialPensionStarts = (rows: SimulationRow[]): ChartChange[] =>
  pairsOf(rows).flatMap(([before, row]): ChartChange[] =>
    before.isp < SPECIAL_PAID && row.isp >= SPECIAL_PAID
      ? [{ kind: 'specialPensionStart', age: row.age }]
      : [],
  );

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

const firstWithdrawalAt = (rows: ChartRow[]): ChartChange[] =>
  rows
    .slice(0, 1)
    .flatMap((first) =>
      (['third', 'second'] as const)
        .filter((pillar) => first[TAXED_LAYER[pillar]] > 0)
        .map((pillar) => ({ kind: 'withdrawalStart' as const, age: first.age, pillar })),
    );

export const changeKeyOf = (change: ChartChange): string =>
  [
    change.age,
    change.kind,
    'pillar' in change ? change.pillar : '',
    'pillars' in change ? change.pillars : '',
  ].join('-');

export const chartChangesOf = (
  result: Result,
  chartRows: ChartRow[],
  events: ChartEvent[],
  isNominal = false,
): ChartChange[] => {
  const rows = chartRows.filter(({ isBeforePension }) => !isBeforePension);
  const resultRows = result.rows.filter(({ age }) => age >= result.pensionStartAge);
  const resultRowAt = (age: number) => resultRows.find((row) => row.age === age);
  const lastAge = rows[rows.length - 1]?.age ?? result.pensionStartAge;
  const allowanceEnd = result.rescueAllowance?.until;
  const changes: ChartChange[] = [
    ...changesFromEvents(events),
    ...(allowanceEnd !== undefined && allowanceEnd <= lastAge
      ? [
          {
            kind: 'rescueAllowanceEnd' as const,
            age: allowanceEnd,
            pensionStarts: (resultRowAt(allowanceEnd)?.i1g ?? 0) > STATE_PENSION_PAID,
          },
        ]
      : []),
    ...statePensionRises(resultRows, isNominal),
    ...specialPensionStarts(resultRows),
    ...firstWithdrawalAt(rows),
    ...withdrawalChanges(rows, resultRowAt, 'third'),
    ...withdrawalChanges(rows, resultRowAt, 'second'),
  ];
  const isFirstOfItsKey = (change: ChartChange, index: number) =>
    changes.findIndex((other) => changeKeyOf(other) === changeKeyOf(change)) === index;
  return changes
    .filter(isFirstOfItsKey)
    .sort((a, b) => a.age - b.age || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
};
