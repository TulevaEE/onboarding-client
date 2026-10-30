import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  INCOME_TAX,
  INFLATION,
  LifeTable,
  oneContractTerm,
  p3Factor,
  SeparateThirdPillar,
  Sex,
  TAX_SHORT,
  yearlyContractTerm,
} from './engine/pension';
import {
  amountOf,
  birthYearOrFallback,
  pensionAgeValue,
  rateOf,
  ThirdPillarPlan,
  YouAnswers,
} from './youAnswers';
import { hasReachedAge } from './planAges';
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
  endAge?: number;
}

export interface ThirdPillarPayout {
  gross: number;
  tax: number;
  net: number;
  firstMonthly: number;
  leftAtPension: number;
  monthly: { age: number; amount: number }[];
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
  hasReachedPensionAge,
}: {
  hasThirdPillar: boolean;
  hasReachedPensionAge: boolean;
}): boolean => hasThirdPillar && !hasReachedPensionAge;

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
      monthly: [],
    };
  }

  const firstTerm = oneContractTerm(lifeTable, sex, age, input.endAge);
  const yearsLeftAt = (at: number): number =>
    input.contract === 'once' ? firstTerm - (at - age) : yearlyContractTerm(lifeTable, sex, at);

  let gross = 0;
  const monthly: ThirdPillarPayout['monthly'] = [];
  for (let at = age; at < pensionAge; at += 1) {
    const payment = balance / yearsLeftAt(at);
    monthly.push({ age: at, amount: payment / MONTHS_IN_YEAR });
    gross += payment;
    balance = grow(balance - payment, at);
  }
  return {
    gross,
    tax: 0,
    net: gross,
    firstMonthly: monthly[0]?.amount ?? 0,
    leftAtPension: balance,
    monthly,
  };
};

export const thirdPillarPayoutInputOf = (
  answers: YouAnswers,
  firstYearShare: number,
  contract?: ThirdPillarPayoutInput['contract'],
  endAge?: number,
): ThirdPillarPayoutInput => {
  const birthYear = birthYearOrFallback(answers);
  return {
    birthYear,
    sex: answers.sex,
    pensionAge: pensionAgeValue(answers),
    age: withdrawalAge(CURRENT_YEAR - birthYear),
    balance: amountOf(answers.thirdPillarAmount),
    monthlyContribution: amountOf(answers.thirdPillarMonthly),
    returnRate: rateOf(answers.thirdPillarReturnPercent),
    firstYearShare,
    contract,
    endAge,
  };
};

export const age55Of = (
  answers: YouAnswers,
  firstYearShare: number,
  contract?: ThirdPillarPayoutInput['contract'],
  endAge?: number,
): Age55 => {
  const birthYear = birthYearOrFallback(answers);
  const age = withdrawalAge(CURRENT_YEAR - birthYear);
  const pensionAge = pensionAgeValue(answers);
  const hasThirdPillar =
    amountOf(answers.thirdPillarAmount) > 0 || amountOf(answers.thirdPillarMonthly) > 0;
  const hasReachedPensionAge = hasReachedAge(
    { birthYear, birthMonth: answers.birthMonth ?? undefined },
    pensionAge,
  );
  const isAllowed =
    answers.thirdPillarJoined === 'before' &&
    isWithdrawalAllowed({ hasThirdPillar, hasReachedPensionAge });
  const isFundAvailable = isFundPensionAvailable(age);
  const plan = effectivePlan(answers.thirdPillarPlan, { isAllowed, isFundAvailable });
  let lock: Age55Lock | null = null;
  if (!hasThirdPillar) {
    lock = 'noThirdPillar';
  } else if (hasReachedPensionAge) {
    lock = 'pensionAge';
  }
  return {
    hasThirdPillar,
    age,
    pensionAge,
    lock,
    isFundAvailable,
    plan,
    payout: thirdPillarPayout(
      plan,
      thirdPillarPayoutInputOf(answers, firstYearShare, contract, endAge),
    ),
  };
};
