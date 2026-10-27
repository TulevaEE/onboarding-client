import { CURRENT_YEAR, retirementYears } from './engine/pension';
import { FutureMeStep, StepId, StepPlanInput } from './steps';
import { amountOf, birthYearOrFallback, YouAnswers } from './youAnswers';

export type PayoutChoice = 'grow' | 'fund' | 'lump';
export type Tense = 'past' | 'present' | 'future';
export type DecisionOrdinal = 'first' | 'second' | 'third';

export const PAYOUT_CHOICES: PayoutChoice[] = ['grow', 'fund', 'lump'];

const YEARS_BEFORE_PENSION_AGE = 5;

export interface Age60Answers {
  secondPillar: PayoutChoice;
  thirdPillar: PayoutChoice;
}

export const initialAge60 = (): Age60Answers => ({ secondPillar: 'grow', thirdPillar: 'grow' });

export const payoutAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - YEARS_BEFORE_PENSION_AGE;

export const payoutAgeTense = (birthYear: number, age: number): Tense => {
  const currentAge = CURRENT_YEAR - birthYear;
  if (age < currentAge) {
    return 'past';
  }
  return age > currentAge ? 'future' : 'present';
};

const plannedThirdPillarOpenAge = (answers: YouAnswers, plan: StepPlanInput): number => {
  const nextAge = CURRENT_YEAR - birthYearOrFallback(answers) + 1;
  const typed = parseInt(answers.thirdPillarOpenAge, 10);
  return Math.min(
    retirementYears(plan) - 1,
    Math.max(nextAge, Number.isNaN(typed) ? nextAge : typed),
  );
};

export const hasThirdPillarAt = (
  answers: YouAnswers,
  plan: StepPlanInput,
  age: number,
): boolean => {
  if (answers.thirdPillarJoined === 'none') {
    return (
      amountOf(answers.thirdPillarMonthly) > 0 && plannedThirdPillarOpenAge(answers, plan) < age
    );
  }
  return amountOf(answers.thirdPillarMonthly) > 0 || amountOf(answers.thirdPillarAmount) > 0;
};

const DECISION_ORDINALS: DecisionOrdinal[] = ['first', 'second', 'third'];
const EARLIER_DECISION_STEPS: StepId[] = [FutureMeStep.EARLY_WITHDRAWAL, FutureMeStep.AGE_55];

export const decisionOrdinal = (steps: StepId[]): DecisionOrdinal =>
  DECISION_ORDINALS[EARLIER_DECISION_STEPS.filter((step) => steps.includes(step)).length];
