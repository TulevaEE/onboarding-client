import { CURRENT_YEAR, retirementYears } from './engine/pension';
import { StepPlanInput } from './steps';
import { amountOf, birthYearOrFallback, YouAnswers } from './youAnswers';

export type Tense = 'past' | 'present' | 'future';

const YEARS_BEFORE_PENSION_AGE = 5;

export const payoutAge = (plan: StepPlanInput): number =>
  retirementYears(plan) - YEARS_BEFORE_PENSION_AGE;

const MONTHS_IN_YEAR = 12;

export const hasReachedAge = (
  { birthYear, birthMonth = 1 }: Pick<StepPlanInput, 'birthYear' | 'birthMonth'>,
  age: number,
  today: Date = new Date(),
): boolean => {
  const monthsSinceBirth =
    (today.getFullYear() - birthYear) * MONTHS_IN_YEAR + today.getMonth() - (birthMonth - 1);
  return monthsSinceBirth >= age * MONTHS_IN_YEAR;
};

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
  if (answers.thirdPillarJoined === 'never') {
    return false;
  }
  if (answers.thirdPillarJoined === 'plan') {
    return (
      amountOf(answers.thirdPillarMonthly) > 0 && plannedThirdPillarOpenAge(answers, plan) < age
    );
  }
  return amountOf(answers.thirdPillarMonthly) > 0 || amountOf(answers.thirdPillarAmount) > 0;
};
