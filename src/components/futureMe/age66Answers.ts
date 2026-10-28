import { Age60Answers, PayoutChoice } from './age60Answers';
import { Age65Answers, isPayoutChoiceMadeAtAnotherStep } from './age65Answers';
import { FirstPillarChoice } from './engine/pension';
import { StepPlanInput } from './steps';
import { YouAnswers } from './youAnswers';
import { hasThirdPillarAt, payoutAge, retirementAge } from './planAges';

export type Pillar = 'secondPillar' | 'thirdPillar';
export type Contract = 'yearly' | 'once';
export type ContractLock = 'none' | 'grow' | 'lump';

export const CONTRACTS: Contract[] = ['yearly', 'once'];

const LAST_FUND_START_AGE = 85;
const THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 = 55;
const THIRD_PILLAR_PAYOUT_AGE = 60;

export interface Age66Answers {
  secondPillarFrom: string;
  thirdPillarFrom: string;
  secondPillarContract: Contract;
  thirdPillarContract: Contract;
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
  firstPillarChoicePa: null,
});

const pillarPayoutAge = (pillar: Pillar, { you, plan }: Pick<Age66Context, 'you' | 'plan'>) => {
  if (pillar === 'secondPillar') {
    return payoutAge(plan);
  }
  return you.thirdPillarJoined === 'before'
    ? THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021
    : THIRD_PILLAR_PAYOUT_AGE;
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

export const isContractAsked = (
  pillar: Pillar,
  answers: Age66Answers,
  context: Age66Context,
): boolean =>
  hasPillar(pillar, context) &&
  (payoutAtPensionAge(pillar, context) === 'fund' ||
    fundStartOf(pillar, answers, context) !== undefined);

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
