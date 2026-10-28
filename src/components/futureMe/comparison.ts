import lifeTableData from './engine/lifeTable.json';
import {
  LifeTable,
  options,
  Scenario,
  SCENARIOS,
  simulate,
  sustainableNeed,
} from './engine/pension';
import {
  MAX_AGE_SHOWN,
  Result,
  ResultContext,
  resultInputOf,
  resultScenarioOf,
} from './resultAnswers';

const lifeTable: LifeTable = lifeTableData;
const BRIDGE_ID = 'C';
const KEEP_GROWING: Scenario = { id: 'E' };
const BRIDGE_DEFERRAL_YEARS = 2;
const NEVER = MAX_AGE_SHOWN + 1;

export type ComparisonRowId =
  | 'covers'
  | 'outlived'
  | 'moneyEnd'
  | 'spendAt90'
  | 'sustainable'
  | 'expectedLifetime';

export interface ComparisonRow {
  id: ComparisonRowId;
  value: number;
}

export interface ComparisonColumn {
  id: string;
  isMine: boolean;
  result: Result;
}

export const comparisonScenariosOf = (context: ResultContext): Scenario[] => {
  const isBridgeOpen = options(resultInputOf(context)).deferral.open;
  const mine = resultScenarioOf(context);
  const timing = { deferral: mine.deferral ?? 0, half: mine.half ?? 0 };
  return [...SCENARIOS, KEEP_GROWING]
    .filter(({ id }) => id !== BRIDGE_ID || isBridgeOpen)
    .map((route) => {
      if (route.id === mine.id) {
        return mine;
      }
      return route.id === BRIDGE_ID
        ? { ...route, half: 0, deferral: timing.deferral || BRIDGE_DEFERRAL_YEARS }
        : { ...route, ...timing };
    });
};

export const comparisonOf = (context: ResultContext): ComparisonColumn[] => {
  const input = resultInputOf(context);
  const mine = resultScenarioOf(context);
  return comparisonScenariosOf(context).map((scenario) => ({
    id: scenario.id,
    isMine: scenario.id === mine.id,
    result: {
      ...simulate(input, lifeTable, scenario),
      sustainable: sustainableNeed(input, lifeTable, scenario),
    },
  }));
};

export const comparisonRowsOf = (result: Result): ComparisonRow[] => {
  const isCoveredForLife = result.coversNeedUntil === null;
  return [
    { id: 'covers', value: result.coversNeedUntil ?? NEVER },
    { id: 'outlived', value: isCoveredForLife ? 0 : result.aliveAtShortfall },
    { id: 'moneyEnd', value: result.moneyEndAge ?? NEVER },
    { id: 'spendAt90', value: result.spendAt90 },
    { id: 'sustainable', value: result.sustainable },
    { id: 'expectedLifetime', value: result.expectedLifetime },
  ];
};

export const ROWS_WITH_BEST_COLUMN: ComparisonRowId[] = [
  'covers',
  'moneyEnd',
  'spendAt90',
  'sustainable',
  'expectedLifetime',
];

export const bestColumnsOf = (values: number[]): number[] => {
  const best = Math.max(...values);
  const bestColumns = values.flatMap((value, column) => (value === best ? [column] : []));
  return bestColumns.length === values.length ? [] : bestColumns;
};
