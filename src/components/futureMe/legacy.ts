import { DecisionChanges } from './decisions';
import { needMonthly } from './expensesAnswers';
import lifeTableData from './engine/lifeTable.json';
import { CURRENT_YEAR, LifeTable, PensionInput, survival } from './engine/pension';
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

export type Legacy =
  | { kind: 'shortfall'; isSecondPillarLumpSum: boolean; secondPillarReturn: number }
  | { kind: 'surplus'; medianAge: number; left: number; sustainable: number; extra: number };

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
  const isCoverageOverByMedianAge =
    result.coversNeedUntil !== null && result.coversNeedUntil <= medianAge;
  if (left < MIN_LEFT_OVER || isCoverageOverByMedianAge) {
    return {
      kind: 'shortfall',
      isSecondPillarLumpSum: resultScenarioOf(context).id === 'A',
      secondPillarReturn: input.realReturn,
    };
  }
  return {
    kind: 'surplus',
    medianAge,
    left,
    sustainable: result.sustainable,
    extra: Math.max(0, result.sustainable - needMonthly(context.expenses)),
  };
};

export const keepSecondPillarGrowing = ({ age60, age65 }: ResultContext): DecisionChanges => ({
  age60: { ...age60, secondPillar: 'grow' },
  age65: { ...age65, secondPillar: 'grow' },
});
