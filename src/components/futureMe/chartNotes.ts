import { ChartRow, ChartSourceId } from './chartData';
import { ChartEvent } from './chartEvents';
import { FirstPillarChoice, PENSIONER_ALLOWANCE } from './engine/pension';
import { Result } from './resultAnswers';

const MONTHS_IN_YEAR = 12;
const PAID_FROM = 0.5;
const BRIDGE_SOURCES: ChartSourceId[] = [
  'specialPension',
  'secondPillar',
  'thirdPillar',
  'deposit',
];

export interface BridgeSource {
  id: ChartSourceId;
  amount: number;
}

export type SummaryNote =
  | { kind: 'bridge'; statePensionAge: number; sources: BridgeSource[] }
  | {
      kind: 'firstPillarChoice';
      paid: FirstPillarChoice;
      special: number;
      oldAge: number;
    }
  | {
      kind: 'statePensionTax' | 'specialPensionTax';
      gross: number;
      tax: number;
      allowance: number;
    };

export interface Assumption {
  from: number;
  missing: number;
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const bridgeNoteOf = (result: Result, rows: ChartRow[]): SummaryNote[] => {
  const bridge = rows.filter(({ age, salary }) => age < result.p1StartAge && salary === 0);
  const sources = BRIDGE_SOURCES.map((id) => ({
    id,
    amount: Math.round(average(bridge.map((row) => row[id]))),
  })).filter(({ amount }) => amount > 0);
  return bridge.length > 0 && sources.length > 0
    ? [{ kind: 'bridge', statePensionAge: result.p1StartAge, sources }]
    : [];
};

export const summaryNotesOf = (result: Result, rows: ChartRow[]): SummaryNote[] => {
  const allowance = PENSIONER_ALLOWANCE / MONTHS_IN_YEAR;
  const fromPensionAge = result.rows.filter(({ age }) => age >= result.pensionStartAge);
  const statePension = fromPensionAge.find(({ i1g }) => i1g > PAID_FROM);
  const specialPension = fromPensionAge.find(({ ispg }) => ispg > PAID_FROM);
  const { firstPillar } = result;
  const choiceAtPensionAge = firstPillar?.atPa ?? firstPillar;
  return [
    ...bridgeNoteOf(result, rows),
    ...(firstPillar && choiceAtPensionAge
      ? [
          {
            kind: 'firstPillarChoice' as const,
            paid: choiceAtPensionAge.paid,
            special: firstPillar.special,
            oldAge: choiceAtPensionAge.oldAge,
          },
        ]
      : []),
    ...(statePension
      ? [
          {
            kind: 'statePensionTax' as const,
            gross: statePension.i1g,
            tax: statePension.tax1,
            allowance,
          },
        ]
      : []),
    ...(specialPension
      ? [
          {
            kind: 'specialPensionTax' as const,
            gross: specialPension.ispg,
            tax: specialPension.taxSp,
            allowance,
          },
        ]
      : []),
  ];
};

export const assumptionOf = (
  result: Result,
  rows: ChartRow[],
  events: ChartEvent[],
): Assumption | null => {
  const retired = rows.filter(({ salary }) => salary === 0);
  const firstDepositUse = retired.find(({ deposit }) => deposit > 0);
  const fundPensionEnds = events.some(({ kind }) => kind === 'fundEnd');
  const hasSurplus = rows.some(({ surplus }) => surplus > 0);
  if (result.coversNeedUntil !== null || !fundPensionEnds || !hasSurplus || !firstDepositUse) {
    return null;
  }
  return {
    from: firstDepositUse.age,
    missing: Math.max(...retired.map(({ deposit }) => deposit)),
  };
};
