import { Age60Answers } from './age60Answers';
import { Age65Answers } from './age65Answers';
import { Age66Answers, fundStartOf, hasPillar, payoutAtPensionAge } from './age66Answers';
import { ExpensesAnswers, needMonthly } from './expensesAnswers';
import lifeTableData from './engine/lifeTable.json';
import {
  INFLATION,
  LifeTable,
  PensionInput,
  Scenario,
  SCENARIOS,
  simulate,
  SimulationResult,
  sustainableNeed,
  WAGE_GROWTH,
} from './engine/pension';
import { pensionInputOf, SpecialPensionAnswers } from './specialPensionAnswers';
import { StepPlanInput } from './steps';
import { amountOf, FUND_RETURNS, YouAnswers } from './youAnswers';

const lifeTable: LifeTable = lifeTableData;
const MONTHS_IN_YEAR = 12;
export const MAX_AGE_SHOWN = 100;
const keepGrowing: Scenario = { id: 'E', name: 'Jätkan kasvatamist' };

export interface ResultContext {
  you: YouAnswers;
  plan: StepPlanInput;
  age60: Age60Answers;
  age65: Age65Answers;
  age66: Age66Answers;
  specialPension: SpecialPensionAnswers;
  expenses: ExpensesAnswers;
}

export interface Result extends SimulationResult {
  sustainable: number;
}

const thirdPillarOf = (context: ResultContext): PensionInput['p3Sep'] => {
  const { you, age66 } = context;
  if (!hasPillar('thirdPillar', context)) {
    return null;
  }
  const payout = payoutAtPensionAge('thirdPillar', context);
  const start = fundStartOf('thirdPillar', age66, context);
  return {
    amount: you.thirdPillarJoined === 'none' ? 0 : amountOf(you.thirdPillarAmount),
    mode: start === undefined ? payout : 'fund',
    contract: age66.thirdPillarContract,
    start,
  };
};

export const resultInputOf = (context: ResultContext): PensionInput => {
  const { you, plan, age65, age66, specialPension, expenses } = context;
  const hasSpecialPension = amountOf(specialPension.monthly) > 0;
  return {
    ...pensionInputOf(specialPension, you, plan, age65, age66),
    spHas: hasSpecialPension,
    spMonthly: hasSpecialPension ? amountOf(specialPension.monthly) : 0,
    p2: amountOf(you.secondPillarAmount),
    p3: 0,
    p3Sep: thirdPillarOf(context),
    p3Monthly: amountOf(you.thirdPillarMonthly),
    p3Before2021: you.thirdPillarJoined === 'before',
    p3Indexed: false,
    needMonthly: needMonthly(expenses),
    realReturn: FUND_RETURNS[you.secondPillarFund],
    realReturn3: FUND_RETURNS[you.thirdPillarFund],
    wageGrowth: WAGE_GROWTH,
    inflation: INFLATION,
    firstYearShare: (MONTHS_IN_YEAR - new Date().getMonth()) / MONTHS_IN_YEAR,
  };
};

const scenarioById = (id: string): Scenario =>
  SCENARIOS.find((scenario) => scenario.id === id) ?? { id };

export const resultScenarioOf = (context: ResultContext): Scenario => {
  const { age65, age66 } = context;
  const payout = hasPillar('secondPillar', context)
    ? payoutAtPensionAge('secondPillar', context)
    : 'grow';
  const timing = {
    deferral: age65.mode === 'defer' ? age65.years : 0,
    half: age65.mode === 'half' ? age65.years : 0,
  };
  const contractScenario = scenarioById(age66.secondPillarContract === 'yearly' ? 'D' : 'B');
  if (payout === 'lump') {
    return { ...scenarioById('A'), ...timing };
  }
  if (payout === 'grow') {
    const fundFrom = fundStartOf('secondPillar', age66, context);
    return fundFrom === undefined
      ? { ...keepGrowing, ...timing }
      : { ...contractScenario, ...timing, fundFrom };
  }
  return timing.deferral > 0
    ? { ...scenarioById('C'), ...timing, contract: age66.secondPillarContract }
    : { ...contractScenario, ...timing };
};

export const resultOf = (context: ResultContext): Result => {
  const input = resultInputOf(context);
  const scenario = resultScenarioOf(context);
  return {
    ...simulate(input, lifeTable, scenario),
    sustainable: sustainableNeed(input, lifeTable, scenario),
  };
};
