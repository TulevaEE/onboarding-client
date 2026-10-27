import { PayoutChoice, payoutAge } from './age60Answers';
import {
  DEFERRAL_INCREASE,
  EARLY_DECREASE,
  FirstPillarChoice,
  retirementYears,
  workAccrual,
} from './engine/pension';
import { StepPlanInput } from './steps';
import {
  amountOf,
  earlyRetirementRight,
  earlyRetirementYears,
  isSpecialPensionOn,
  YouAnswers,
} from './youAnswers';

export type PensionMode = 'full' | 'half' | 'defer';
export type PensionKind = 'regular' | 'favourable' | 'flexible';
export type DeferralLock = 'specialPension' | PensionKind;

export const PENSION_MODES: PensionMode[] = ['full', 'half', 'defer'];
export const DEFERRAL_YEARS = [1, 2, 3, 4, 5];

const LAST_WORK_AGE_MIN = 75;
const YEARS_WORKED_PAST_PENSION_AGE = 5;

export interface Age65Answers {
  work: 'no' | 'yes';
  workUntil: string;
  thirdPillarAfterMode: 'same' | 'change';
  thirdPillarAfter: string;
  mode: PensionMode;
  years: number;
  secondPillar: PayoutChoice;
  thirdPillar: PayoutChoice;
  firstPillarChoice: FirstPillarChoice | null;
}

export const initialAge65 = (): Age65Answers => ({
  work: 'no',
  workUntil: '',
  thirdPillarAfterMode: 'same',
  thirdPillarAfter: '',
  mode: 'full',
  years: 1,
  secondPillar: 'grow',
  thirdPillar: 'grow',
  firstPillarChoice: null,
});

export const withMode = (answers: Age65Answers, mode: PensionMode): Age65Answers => ({
  ...answers,
  mode,
});

export const retirementAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - plan.earlyRetirementYears;

export const isPayoutChoiceMadeAtAnotherStep = (plan: StepPlanInput): boolean =>
  retirementAge(plan) <= payoutAge(plan);

export const pensionKind = (you: YouAnswers): PensionKind => {
  const years = earlyRetirementYears(you);
  if (years === 0) {
    return 'regular';
  }
  return years > earlyRetirementRight(you) ? 'flexible' : 'favourable';
};

export const deferralLock = (you: YouAnswers): DeferralLock | null => {
  if (isSpecialPensionOn(you)) {
    return 'specialPension';
  }
  const kind = pensionKind(you);
  return kind === 'regular' ? null : kind;
};

export const earlyDecrease = (plan: StepPlanInput): number =>
  EARLY_DECREASE[plan.earlyRetirementYears] ?? 0;

export const deferredMonthly = (
  firstPillarMonthly: number,
  mode: PensionMode,
  years: number,
): number => {
  if (mode === 'full') {
    return firstPillarMonthly;
  }
  const increase = DEFERRAL_INCREASE[years] ?? 0;
  return firstPillarMonthly * (1 + (mode === 'half' ? increase / 2 : increase));
};

export const workUntilOptions = (plan: StepPlanInput): number[] => {
  const first = retirementAge(plan) + 1;
  const last = Math.max(retirementYears(plan) + YEARS_WORKED_PAST_PENSION_AGE, LAST_WORK_AGE_MIN);
  return Array.from({ length: last - first + 1 }, (_, offset) => first + offset);
};

const defaultWorkUntil = (plan: StepPlanInput): number =>
  plan.earlyRetirementYears > 0 ? retirementYears(plan) : retirementAge(plan) + 1;

export const workUntilOf = (answers: Age65Answers, plan: StepPlanInput): number | undefined => {
  if (answers.work !== 'yes') {
    return undefined;
  }
  const picked = Number(answers.workUntil);
  return workUntilOptions(plan).includes(picked) ? picked : defaultWorkUntil(plan);
};

export const workAccrualMonthly = (you: YouAnswers): number => {
  const isContributing = Number(you.secondPillarRate) > 0;
  return workAccrual(amountOf(you.grossMonthly), isContributing, isContributing);
};

export const thirdPillarAfterAsked = (
  answers: Age65Answers,
  you: YouAnswers,
  plan: StepPlanInput,
): boolean =>
  answers.work !== 'yes' &&
  amountOf(you.thirdPillarMonthly) > 0 &&
  retirementAge(plan) < retirementYears(plan);

export const deferralYearsWhileWorking = (answers: Age65Answers, plan: StepPlanInput): number => {
  const until = workUntilOf(answers, plan);
  return until === undefined
    ? 0
    : Math.min(Math.max(...DEFERRAL_YEARS), until - retirementYears(plan));
};
