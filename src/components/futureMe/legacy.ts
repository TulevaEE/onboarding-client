import { DecisionChanges } from './decisions';
import { needMonthly } from './expensesAnswers';
import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  LifeTable,
  PensionInput,
  survival,
} from './engine/pension';
import {
  MAX_AGE_SHOWN,
  Result,
  ResultContext,
  resultInputOf,
  resultScenarioOf,
} from './resultAnswers';

const lifeTable: LifeTable = lifeTableData;
const MEDIAN_SURVIVAL = 0.5;
const MIN_LEFT_OVER = 1000;
const NOTICEABLE_SHORTFALL = 0.5;

export type Legacy =
  | { kind: 'shortfall'; isGrowingSecondPillarSuggested: boolean; secondPillarReturn: number }
  | {
      kind: 'surplus';
      medianAge: number;
      left: number;
      sustainable: number;
      costs: number;
      extra: number;
    };

const medianAgeOf = ({ birthYear, sex }: PensionInput): number => {
  const currentAge = CURRENT_YEAR - birthYear;
  for (let age = currentAge; age <= MAX_AGE_SHOWN; age += 1) {
    if (survival(lifeTable, sex, currentAge, age) <= MEDIAN_SURVIVAL) {
      return age;
    }
  }
  return MAX_AGE_SHOWN;
};

export const legacyOf = (context: ResultContext, result: Result): Legacy => {
  const input = resultInputOf(context);
  const medianAge = medianAgeOf(input);
  const left = result.rows.find((row) => row.age === medianAge)?.moneyLeft ?? 0;
  const isCoverageOverByMedianAge = result.rows
    .filter((row) => row.age >= medianAge)
    .every((row) => row.shortfall > NOTICEABLE_SHORTFALL);
  if (left < MIN_LEFT_OVER || isCoverageOverByMedianAge) {
    return {
      kind: 'shortfall',
      isGrowingSecondPillarSuggested:
        resultScenarioOf(context).id === 'A' && input.realReturn >= 0,
      secondPillarReturn: input.realReturn,
    };
  }
  const costs = needMonthly(context.expenses);
  return {
    kind: 'surplus',
    medianAge,
    left,
    sustainable: result.sustainable,
    costs,
    extra: Math.max(0, result.sustainable - costs),
  };
};

export const keepSecondPillarGrowing = ({ age60, age65 }: ResultContext): DecisionChanges => ({
  age60: { ...age60, secondPillar: 'grow' },
  age65: { ...age65, secondPillar: 'grow' },
});
