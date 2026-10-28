import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  fundPensionTerm,
  INCOME_TAX,
  INFLATION,
  LifeTable,
  p3Factor,
  SeparateThirdPillar,
  Sex,
  TAX_SHORT,
} from './engine/pension';
import {
  amountOf,
  birthYearOrFallback,
  FUND_RETURNS,
  pensionAgeValue,
  ThirdPillarPlan,
  YouAnswers,
} from './youAnswers';
import { THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 } from './thirdPillarPayoutAges';

const lifeTable: LifeTable = lifeTableData;

const MONTHS_IN_YEAR = 12;

export type Age55Lock = 'noThirdPillar' | 'pensionAge';

export interface ThirdPillarPayoutInput {
  birthYear: number;
  sex: Sex;
  pensionAge: number;
  age: number;
  balance: number;
  monthlyContribution: number;
  returnRate: number;
  firstYearShare: number;
  contract?: SeparateThirdPillar['contract'];
}

export interface ThirdPillarPayout {
  gross: number;
  tax: number;
  net: number;
  firstMonthly: number;
  leftAtPension: number;
}

export interface Age55 {
  hasThirdPillar: boolean;
  age: number;
  pensionAge: number;
  lock: Age55Lock | null;
  isFundAvailable: boolean;
  plan: ThirdPillarPlan;
  payout: ThirdPillarPayout | null;
}

export const withdrawalAge = (currentAge: number): number =>
  Math.max(THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021, currentAge);

export const isWithdrawalAllowed = ({
  hasThirdPillar,
  age,
  pensionAge,
}: {
  hasThirdPillar: boolean;
  age: number;
  pensionAge: number;
}): boolean => hasThirdPillar && age < pensionAge;

export const isFundPensionAvailable = (age: number): boolean =>
  age >= THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021;

export const effectivePlan = (
  chosen: ThirdPillarPlan,
  { isAllowed, isFundAvailable }: { isAllowed: boolean; isFundAvailable: boolean },
): ThirdPillarPlan => {
  if (!isAllowed || (chosen === 'fund' && !isFundAvailable)) {
    return 'keep';
  }
  return chosen;
};

export const thirdPillarPayout = (
  plan: ThirdPillarPlan,
  input: ThirdPillarPayoutInput,
): ThirdPillarPayout | null => {
  if (plan === 'keep') {
    return null;
  }
  const { birthYear, sex, pensionAge, age, monthlyContribution, returnRate } = input;
  const currentAge = CURRENT_YEAR - birthYear;
  const contributionAt = (at: number): number =>
    monthlyContribution *
    MONTHS_IN_YEAR *
    (at === currentAge ? input.firstYearShare : 1) *
    p3Factor({ p3Indexed: false, inflation: INFLATION, birthYear }, at);
  const grow = (balance: number, at: number): number =>
    balance * (1 + returnRate) + contributionAt(at);

  let { balance } = input;
  for (let at = currentAge; at < age; at += 1) {
    balance = grow(balance, at);
  }

  if (plan === 'lump') {
    const rate = isFundPensionAvailable(age) ? TAX_SHORT : INCOME_TAX;
    return {
      gross: balance,
      tax: balance * rate,
      net: balance * (1 - rate),
      firstMonthly: 0,
      leftAtPension: 0,
    };
  }

  const firstTerm = fundPensionTerm(lifeTable, sex, age);
  const yearsLeftAt = (at: number): number =>
    input.contract === 'once' ? firstTerm - (at - age) : fundPensionTerm(lifeTable, sex, at);

  let gross = 0;
  let firstMonthly = 0;
  for (let at = age; at < pensionAge; at += 1) {
    const payment = balance / yearsLeftAt(at);
    firstMonthly = at === age ? payment / MONTHS_IN_YEAR : firstMonthly;
    gross += payment;
    balance = grow(balance - payment, at);
  }
  return { gross, tax: 0, net: gross, firstMonthly, leftAtPension: balance };
};

export const thirdPillarPayoutInputOf = (
  answers: YouAnswers,
  firstYearShare: number,
  contract?: ThirdPillarPayoutInput['contract'],
): ThirdPillarPayoutInput => {
  const birthYear = birthYearOrFallback(answers);
  return {
    birthYear,
    sex: answers.sex,
    pensionAge: pensionAgeValue(answers),
    age: withdrawalAge(CURRENT_YEAR - birthYear),
    balance: amountOf(answers.thirdPillarAmount),
    monthlyContribution: amountOf(answers.thirdPillarMonthly),
    returnRate: FUND_RETURNS[answers.thirdPillarFund],
    firstYearShare,
    contract,
  };
};

export const age55Of = (
  answers: YouAnswers,
  firstYearShare: number,
  contract?: ThirdPillarPayoutInput['contract'],
): Age55 => {
  const birthYear = birthYearOrFallback(answers);
  const age = withdrawalAge(CURRENT_YEAR - birthYear);
  const pensionAge = pensionAgeValue(answers);
  const hasThirdPillar =
    amountOf(answers.thirdPillarAmount) > 0 || amountOf(answers.thirdPillarMonthly) > 0;
  const isAllowed =
    answers.thirdPillarJoined === 'before' &&
    isWithdrawalAllowed({ hasThirdPillar, age, pensionAge });
  const isFundAvailable = isFundPensionAvailable(age);
  const plan = effectivePlan(answers.thirdPillarPlan, { isAllowed, isFundAvailable });
  let lock: Age55Lock | null = null;
  if (!hasThirdPillar) {
    lock = 'noThirdPillar';
  } else if (age >= pensionAge) {
    lock = 'pensionAge';
  }
  return {
    hasThirdPillar,
    age,
    pensionAge,
    lock,
    isFundAvailable,
    plan,
    payout: thirdPillarPayout(plan, thirdPillarPayoutInputOf(answers, firstYearShare, contract)),
  };
};
