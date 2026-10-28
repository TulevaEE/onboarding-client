import { CURRENT_YEAR, retirementYears } from './engine/pension';
import { StepPlanInput } from './steps';
import { amountOf, birthYearOrFallback, YouAnswers } from './youAnswers';

export type Tense = 'past' | 'present' | 'future';

const YEARS_BEFORE_PENSION_AGE = 5;

export const payoutAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - YEARS_BEFORE_PENSION_AGE;

export const retirementAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - plan.earlyRetirementYears;

export const ageTense = (birthYear: number, age: number): Tense => {
  const currentAge = CURRENT_YEAR - birthYear;
  if (age < currentAge) {
    return 'past';
  }
  return age > currentAge ? 'future' : 'present';
};

export const plannedThirdPillarOpenAge = (answers: YouAnswers, plan: StepPlanInput): number => {
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
