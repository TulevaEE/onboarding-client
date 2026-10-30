import { Age60Answers, PayoutChoice } from './age60Answers';
import { Age65Answers, isPayoutChoiceMadeAtAnotherStep, workUntilOf } from './age65Answers';
import {
  CURRENT_YEAR,
  FirstPillarChoice,
  fundPensionTerm,
  horizonAge,
  LifeTable,
  retirementYears,
} from './engine/pension';
import lifeTableData from './engine/lifeTable.json';
import { FutureMeStep, StepId, StepPlanInput } from './steps';
import { age55Of } from './age55';
import { YouAnswers } from './youAnswers';
import { hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { thirdPillarPayoutAge } from './thirdPillarPayoutAges';

export type Pillar = 'secondPillar' | 'thirdPillar';
export type Contract = 'yearly' | 'once';
export type ContractLock = 'none' | 'grow' | 'lump';

export const CONTRACTS: Contract[] = ['yearly', 'once'];

const lifeTable: LifeTable = lifeTableData;
const LAST_FUND_START_AGE = 85;
const LAST_END_AGE = 100;

export interface Age66Answers {
  secondPillarFrom: string;
  thirdPillarFrom: string;
  secondPillarContract: Contract;
  thirdPillarContract: Contract;
  secondPillarEndAge: string;
  thirdPillarEndAge: string;
  firstPillarChoicePa: FirstPillarChoice | null;
}

export interface Age66Context {
  age60: Age60Answers;
  age65: Age65Answers;
  you: YouAnswers;
  plan: StepPlanInput;
}

export const initialAge66 = (): Age66Answers => ({
  secondPillarFrom: '',
  thirdPillarFrom: '',
  secondPillarContract: 'yearly',
  thirdPillarContract: 'yearly',
  secondPillarEndAge: '',
  thirdPillarEndAge: '',
  firstPillarChoicePa: null,
});

export const endAges = (startAge: number): number[] => {
  const first = startAge + fundPensionTerm(lifeTable, startAge);
  return Array.from(
    { length: Math.max(0, LAST_END_AGE - first + 1) },
    (_, offset) => first + offset,
  );
};

export const longLifeAge = (startAge: number): number => horizonAge(lifeTable, startAge);

export const endAgeOf = (picked: string, startAge: number): number | undefined => {
  const age = Number(picked);
  return picked !== '' && endAges(startAge).includes(age) ? age : undefined;
};

const pillarPayoutAge = (pillar: Pillar, { you, plan }: Pick<Age66Context, 'you' | 'plan'>) => {
  if (pillar === 'secondPillar') {
    return payoutAge(plan);
  }
  return thirdPillarPayoutAge(you.thirdPillarJoined === 'before', retirementYears(plan));
};

export const fundStartAges = (
  pillar: Pillar,
  context: Pick<Age66Context, 'you' | 'plan'>,
): number[] => {
  const first = Math.max(retirementAge(context.plan) + 1, pillarPayoutAge(pillar, context));
  return Array.from({ length: LAST_FUND_START_AGE - first + 1 }, (_, offset) => first + offset);
};

export const hasPillar = (pillar: Pillar, { you, plan }: Age66Context): boolean =>
  pillar === 'secondPillar'
    ? plan.savesInSecondPillar
    : hasThirdPillarAt(you, plan, LAST_FUND_START_AGE);

export const payoutAtPensionAge = (
  pillar: Pillar,
  { age60, age65, plan }: Pick<Age66Context, 'age60' | 'age65' | 'plan'>,
): PayoutChoice =>
  age60[pillar] === 'grow' && !isPayoutChoiceMadeAtAnotherStep(plan)
    ? age65[pillar]
    : age60[pillar];

export const isGrowing = (pillar: Pillar, context: Age66Context): boolean =>
  hasPillar(pillar, context) && payoutAtPensionAge(pillar, context) === 'grow';

export const fundStartField = (pillar: Pillar) =>
  pillar === 'secondPillar' ? 'secondPillarFrom' : 'thirdPillarFrom';

export const contractField = (pillar: Pillar) =>
  pillar === 'secondPillar' ? 'secondPillarContract' : 'thirdPillarContract';

export const endAgeField = (pillar: Pillar) =>
  pillar === 'secondPillar' ? 'secondPillarEndAge' : 'thirdPillarEndAge';

export const fundStartOf = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): number | undefined => {
  const picked = Number(answers[fundStartField(pillar)]);
  return isGrowing(pillar, context) && fundStartAges(pillar, context).includes(picked)
    ? picked
    : undefined;
};

const payoutOpenAge = (pillar: Pillar, context: Age66Context): number => {
  const pensionAge = retirementAge(context.plan);
  const workEnd = workUntilOf(context.age65, context.plan) ?? pensionAge;
  return Math.max(pensionAge, workEnd, pillarPayoutAge(pillar, context));
};

const payoutAgeStart = (pillar: Pillar, context: Age66Context): number =>
  Math.max(
    payoutAge(context.plan),
    pillarPayoutAge(pillar, context),
    CURRENT_YEAR - context.plan.birthYear,
  );

export const fundPensionStartOf = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): number | undefined => {
  if (!hasPillar(pillar, context)) {
    return undefined;
  }
  if (context.age60[pillar] === 'fund') {
    return payoutAgeStart(pillar, context);
  }
  if (payoutAtPensionAge(pillar, context) === 'fund') {
    return payoutOpenAge(pillar, context);
  }
  const picked = fundStartOf(pillar, answers, context);
  return picked === undefined ? undefined : Math.max(picked, payoutOpenAge(pillar, context));
};

export const isContractAsked = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): boolean =>
  hasPillar(pillar, context) &&
  (payoutAtPensionAge(pillar, context) === 'fund' ||
    fundStartOf(pillar, answers, context) !== undefined);

export interface ContractChoiceMade {
  age: number;
  step: StepId;
}

export const contractChosenAt = (
  pillar: Pillar,
  context: Age66Context,
): ContractChoiceMade | null => {
  if (!hasPillar(pillar, context)) {
    return null;
  }
  const age55 = age55Of(context.you, 1);
  if (pillar === 'thirdPillar' && age55.plan === 'fund') {
    return { age: age55.age, step: FutureMeStep.AGE_55 };
  }
  return context.age60[pillar] === 'fund'
    ? { age: payoutAge(context.plan), step: FutureMeStep.AGE_60 }
    : null;
};

export const contractStartAgeOf = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): number | undefined => {
  const chosen = contractChosenAt(pillar, context);
  return chosen?.step === FutureMeStep.AGE_55
    ? chosen.age
    : fundPensionStartOf(pillar, answers, context);
};

export const contractEndAgeOf = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): number | undefined => {
  const startAge = contractStartAgeOf(pillar, answers, context);
  return answers[contractField(pillar)] === 'once' && startAge !== undefined
    ? endAgeOf(answers[endAgeField(pillar)], startAge)
    : undefined;
};

export const contractLock = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): ContractLock | null => {
  if (!hasPillar(pillar, context)) {
    return 'none';
  }
  if (isContractAsked(pillar, answers, context)) {
    return null;
  }
  return payoutAtPensionAge(pillar, context) === 'lump' ? 'lump' : 'grow';
};
