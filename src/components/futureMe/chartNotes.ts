import { ChartRow, ChartSourceId } from './chartData';
import { ChartEvent } from './chartEvents';
import { FirstPillarChoice, PENSIONER_ALLOWANCE } from './engine/pension';
import { nominalFactorAt } from './nominal';
import { Result } from './resultAnswers';

const MONTHS_IN_YEAR = 12;
const PAID_FROM = 0.5;
const BRIDGE_SOURCES: ChartSourceId[] = [
  'specialPension',
  'secondPillar',
  'secondPillarTaxed',
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
  const bridge = rows.filter(
    ({ age, salary, isBeforePension }) =>
      age < result.p1StartAge && salary === 0 && !isBeforePension,
  );
  const sources = BRIDGE_SOURCES.map((id) => ({
    id,
    amount: Math.round(average(bridge.map((row) => row[id]))),
  })).filter(({ amount }) => amount > 0);
  return bridge.length > 0 && sources.length > 0
    ? [{ kind: 'bridge', statePensionAge: result.p1StartAge, sources }]
    : [];
};

export interface CoverSteps {
  hasFundPension: boolean;
  hasDeposit: boolean;
  hasSecondPillarWithdrawal: boolean;
  hasThirdPillarWithdrawal: boolean;
}

export const coverStepsOf = (result: Result, rows: ChartRow[]): CoverSteps => ({
  hasFundPension: result.rows.some(({ fp }) => fp > PAID_FROM),
  hasDeposit: rows.some(({ deposit }) => deposit > 0),
  hasSecondPillarWithdrawal: rows.some(({ secondPillarTaxed }) => secondPillarTaxed > 0),
  hasThirdPillarWithdrawal: result.rows.some(({ extra, extra2 }) => extra - extra2 > PAID_FROM),
});

export const summaryNotesOf = (
  result: Result,
  rows: ChartRow[],
  isNominal = false,
): SummaryNote[] => {
  const allowanceIn = (year: number) =>
    (PENSIONER_ALLOWANCE / MONTHS_IN_YEAR) * (isNominal ? nominalFactorAt(year) : 1);
  const retiredFrom = (from: number) => result.rows.filter(({ age, work }) => age >= from && !work);
  const statePension = retiredFrom(Math.max(result.ordinaryPensionAge, result.p1FullAge)).find(
    ({ i1g }) => i1g > PAID_FROM,
  );
  const specialPension = retiredFrom(result.ordinaryPensionAge).find(
    ({ ispg }) => ispg > PAID_FROM,
  );
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
            allowance: allowanceIn(statePension.year),
          },
        ]
      : []),
    ...(specialPension
      ? [
          {
            kind: 'specialPensionTax' as const,
            gross: specialPension.ispg,
            tax: specialPension.taxSp,
            allowance: allowanceIn(specialPension.year),
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
  const fundEndAges = events.filter(({ kind }) => kind === 'fundEnd').map(({ age }) => age);
  const afterFundEnd = rows.filter(
    ({ age, salary }) => salary === 0 && age >= Math.min(...fundEndAges),
  );
  const firstDepositUse = afterFundEnd.find(({ deposit }) => deposit > 0);
  const hasSurplus = rows.some(({ surplus }) => surplus > 0);
  if (result.coversNeedUntil !== null || !hasSurplus || !firstDepositUse) {
    return null;
  }
  return {
    from: firstDepositUse.age,
    missing: Math.max(...afterFundEnd.map(({ deposit }) => deposit)),
  };
};
