import { age55Of, thirdPillarPayout, thirdPillarPayoutInputOf } from './age55';
import { Age60Answers } from './age60Answers';
import { Age65Answers, deferralLock, thirdPillarAfterAsked, workUntilOf } from './age65Answers';
import { Age66Answers, fundStartOf, hasPillar, payoutAtPensionAge } from './age66Answers';
import { ExpensesAnswers, needMonthly } from './expensesAnswers';
import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  INFLATION,
  LifeTable,
  p3Factor,
  PensionInput,
  Scenario,
  SCENARIOS,
  SeparateThirdPillar,
  simulate,
  SimulationResult,
  SimulationRow,
  sustainableNeed,
  WAGE_GROWTH,
} from './engine/pension';
import { pensionInputOf, SpecialPensionAnswers } from './specialPensionAnswers';
import { StepPlanInput } from './steps';
import { amountOf, rateOf, YouAnswers } from './youAnswers';
import { hasThirdPillarAt, payoutAge, plannedThirdPillarOpenAge } from './planAges';

const lifeTable: LifeTable = lifeTableData;
const MONTHS_IN_YEAR = 12;
export const MAX_AGE_SHOWN = 100;
export const keepGrowing: Scenario = { id: 'E', name: 'Jätkan kasvatamist' };

export interface ResultContext {
  you: YouAnswers;
  plan: StepPlanInput;
  age60: Age60Answers;
  age65: Age65Answers;
  age66: Age66Answers;
  specialPension: SpecialPensionAnswers;
  expenses: ExpensesAnswers;
}

export interface EarlyPayment {
  age: number;
  year: number;
  amount: number;
}

export interface Result extends SimulationResult {
  sustainable: number;
  earlyThirdPillar: EarlyPayment[];
}

export type IncomeSource =
  | 'firstPillar'
  | 'specialPension'
  | 'secondPillar'
  | 'thirdPillar'
  | 'deposit';

export interface IncomeLine {
  id: IncomeSource;
  amount: number;
}

type IncomeRow = Pick<SimulationRow, 'i1' | 'isp' | 'i2' | 'i3' | 'dep'>;

const isShown = (amount: number): boolean => Math.round(amount) > 0;

export const incomeAtStart = (row: IncomeRow): { lines: IncomeLine[]; total: number } => {
  const isStatePensionShown = isShown(row.i1) || !isShown(row.isp);
  const lines = (
    [
      { id: 'firstPillar', amount: row.i1 },
      { id: 'specialPension', amount: row.isp },
      { id: 'secondPillar', amount: row.i2 },
      { id: 'thirdPillar', amount: row.i3 },
      { id: 'deposit', amount: row.dep },
    ] as IncomeLine[]
  ).filter(({ id, amount }) => isShown(amount) || (id === 'firstPillar' && isStatePensionShown));
  return { lines, total: lines.reduce((sum, { amount }) => sum + Math.round(amount), 0) };
};

const firstYearShareNow = (): number => (MONTHS_IN_YEAR - new Date().getMonth()) / MONTHS_IN_YEAR;

const contributionsBefore = (context: ResultContext, untilAge: number): number => {
  const { you, plan } = context;
  const currentAge = CURRENT_YEAR - plan.birthYear;
  const growth = 1 + rateOf(you.thirdPillarReturnPercent);
  const yearly = amountOf(you.thirdPillarMonthly) * MONTHS_IN_YEAR;
  const indexing = { p3Indexed: false, inflation: INFLATION, birthYear: plan.birthYear };
  return Array.from({ length: Math.max(0, untilAge - currentAge) }, (_, offset) => {
    const age = currentAge + offset;
    const share = age === currentAge ? firstYearShareNow() : 1;
    return (yearly * share * p3Factor(indexing, age)) / growth ** (offset + 1);
  }).reduce((sum, value) => sum + value, 0);
};

const fundPensionFrom55Of = (context: ResultContext) => {
  const { you, plan, age65, age66 } = context;
  const { pensionAge } = age55Of(you, firstYearShareNow());
  const paidUntil = Math.max(pensionAge, workUntilOf(age65, plan) ?? pensionAge);
  const payout = thirdPillarPayout('fund', {
    ...thirdPillarPayoutInputOf(you, firstYearShareNow(), age66.thirdPillarContract),
    pensionAge: paidUntil,
  });
  return { paidUntil, payout };
};

const thirdPillarWithdrawnAtOf = (
  context: ResultContext,
): Partial<Pick<SeparateThirdPillar, 'amount' | 'mode' | 'start'>> => {
  const { you, plan } = context;
  const { plan: chosen, age } = age55Of(you, firstYearShareNow());
  if (chosen === 'lump') {
    return { amount: -contributionsBefore(context, age) };
  }
  if (chosen !== 'fund') {
    return {};
  }
  const { paidUntil, payout } = fundPensionFrom55Of(context);
  const yearsUntilPaid = paidUntil - (CURRENT_YEAR - plan.birthYear);
  const leftToday =
    (payout?.leftAtPension ?? 0) / (1 + rateOf(you.thirdPillarReturnPercent)) ** yearsUntilPaid;
  return {
    amount: leftToday - contributionsBefore(context, paidUntil),
    mode: payoutAtPensionAge('thirdPillar', context) === 'lump' ? 'lump' : 'fund',
    start: age,
  };
};

export const earlyThirdPillarOf = (context: ResultContext): EarlyPayment[] => {
  const isPaidFrom55 =
    hasPillar('thirdPillar', context) && age55Of(context.you, firstYearShareNow()).plan === 'fund';
  const monthly = isPaidFrom55 ? fundPensionFrom55Of(context).payout?.monthly ?? [] : [];
  return monthly.map(({ age, amount }) => ({ age, year: context.plan.birthYear + age, amount }));
};

const thirdPillarOf = (context: ResultContext): PensionInput['p3Sep'] => {
  const { you, plan, age66 } = context;
  if (!hasPillar('thirdPillar', context)) {
    return null;
  }
  const payout = payoutAtPensionAge('thirdPillar', context);
  const start = fundStartOf('thirdPillar', age66, context);
  const withdrawn = thirdPillarWithdrawnAtOf(context);
  const savings =
    you.thirdPillarJoined === 'none'
      ? -contributionsBefore(context, plannedThirdPillarOpenAge(you, plan))
      : amountOf(you.thirdPillarAmount);
  return {
    amount: withdrawn.amount ?? savings,
    mode: withdrawn.mode ?? (start === undefined ? payout : 'fund'),
    contract: age66.thirdPillarContract,
    start: withdrawn.start ?? start,
  };
};

const thirdPillarAfterOf = ({ you, plan, age65 }: ResultContext): number | undefined =>
  thirdPillarAfterAsked(age65, you, plan) &&
  age65.thirdPillarAfterMode === 'change' &&
  age65.thirdPillarAfter.trim() !== ''
    ? amountOf(age65.thirdPillarAfter)
    : undefined;

const withChoiceAtPensionAgeWhileAsked = (input: PensionInput): PensionInput => {
  const withoutChoice = { ...input, firstPillarChoicePa: undefined };
  const isAsked =
    input.firstPillarChoicePa !== undefined &&
    simulate(withoutChoice, lifeTable, SCENARIOS[0]).firstPillar?.atPa != null;
  return isAsked ? input : withoutChoice;
};

const secondPillarPayoutFromOf = (context: ResultContext): number | undefined =>
  hasPillar('secondPillar', context) && context.age60.secondPillar !== 'grow'
    ? payoutAge(context.plan)
    : undefined;

const thirdPillarPayoutFromOf = (context: ResultContext): number | undefined => {
  const { you, plan, age60 } = context;
  const isPaidFrom55 = age55Of(you, firstYearShareNow()).plan === 'fund';
  return hasThirdPillarAt(you, plan, payoutAge(plan)) &&
    age60.thirdPillar !== 'grow' &&
    !isPaidFrom55
    ? payoutAge(plan)
    : undefined;
};

export const resultInputOf = (context: ResultContext): PensionInput => {
  const { you, plan, age65, age66, specialPension, expenses } = context;
  const hasSpecialPension = plan.hasSpecialPension && amountOf(specialPension.monthly) > 0;
  return withChoiceAtPensionAgeWhileAsked({
    ...pensionInputOf(specialPension, you, plan, age65, age66),
    spHas: hasSpecialPension,
    spMonthly: hasSpecialPension ? amountOf(specialPension.monthly) : 0,
    p2PayoutFrom: secondPillarPayoutFromOf(context),
    p3: 0,
    p3Sep: thirdPillarOf(context),
    p3PayoutFrom: thirdPillarPayoutFromOf(context),
    p3Monthly: amountOf(you.thirdPillarMonthly),
    p3Before2021: you.thirdPillarJoined === 'before',
    p3Indexed: false,
    needMonthly: needMonthly(expenses),
    realReturn: rateOf(you.secondPillarReturnPercent),
    realReturn3: rateOf(you.thirdPillarReturnPercent),
    p3After: thirdPillarAfterOf(context),
    wageGrowth: WAGE_GROWTH,
    inflation: INFLATION,
    firstYearShare: firstYearShareNow(),
  });
};

const scenarioById = (id: string): Scenario =>
  SCENARIOS.find((scenario) => scenario.id === id) ?? { id };

export const resultScenarioOf = (context: ResultContext): Scenario => {
  const { age65, age66, you } = context;
  const payout = hasPillar('secondPillar', context)
    ? payoutAtPensionAge('secondPillar', context)
    : 'grow';
  const mode = deferralLock(you) === null ? age65.mode : 'full';
  const timing = {
    deferral: mode === 'defer' ? age65.years : 0,
    half: mode === 'half' ? age65.years : 0,
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

export const coverageKind = (result: Result): 'all' | 'gap' | 'none' | 'until' => {
  if (result.coversNeedUntil === null) {
    return 'all';
  }
  if (result.gapTemporary) {
    return 'gap';
  }
  return result.coversNeedUntil <= result.pensionStartAge ? 'none' : 'until';
};

export const resultOf = (context: ResultContext): Result => {
  const input = resultInputOf(context);
  const scenario = resultScenarioOf(context);
  return {
    ...simulate(input, lifeTable, scenario),
    sustainable: sustainableNeed(input, lifeTable, scenario),
    earlyThirdPillar: earlyThirdPillarOf(context),
  };
};
