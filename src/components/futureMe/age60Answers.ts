import { CURRENT_YEAR, retirementYears } from './engine/pension';
import { FutureMeStep, StepId, StepPlanInput } from './steps';
import { amountOf, YouAnswers } from './youAnswers';

export type PayoutChoice = 'grow' | 'fund' | 'lump';
export type Tense = 'past' | 'present' | 'future';
export type DecisionOrdinal = 'first' | 'second';

export const PAYOUT_CHOICES: PayoutChoice[] = ['grow', 'fund', 'lump'];

const YEARS_BEFORE_PENSION_AGE = 5;

export interface Age60Answers {
  secondPillar: PayoutChoice;
  thirdPillar: PayoutChoice;
}

export const initialAge60 = (): Age60Answers => ({ secondPillar: 'grow', thirdPillar: 'grow' });

export const withSecondPillar = (
  answers: Age60Answers,
  secondPillar: PayoutChoice,
): Age60Answers => ({
  ...answers,
  secondPillar,
});

export const withThirdPillar = (
  answers: Age60Answers,
  thirdPillar: PayoutChoice,
): Age60Answers => ({
  ...answers,
  thirdPillar,
});

export const payoutAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - YEARS_BEFORE_PENSION_AGE;

export const payoutAgeTense = (birthYear: number, age: number): Tense => {
  const currentAge = CURRENT_YEAR - birthYear;
  if (age < currentAge) {
    return 'past';
  }
  return age > currentAge ? 'future' : 'present';
};

export const hasThirdPillar = (answers: YouAnswers): boolean =>
  amountOf(answers.thirdPillarMonthly) > 0 ||
  (answers.thirdPillarJoined !== 'none' && amountOf(answers.thirdPillarAmount) > 0);

export const decisionOrdinal = (steps: StepId[]): DecisionOrdinal =>
  steps.includes(FutureMeStep.AGE_55) ? 'second' : 'first';
