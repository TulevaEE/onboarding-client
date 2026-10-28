import { retirementYears } from './engine/pension';
import { THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 } from './thirdPillarPayoutAges';

export const FutureMeStep = {
  YOU: 0,
  AGE_55: 4,
  AGE_60: 5,
  AGE_65: 6,
  AGE_66_PLUS: 7,
  COSTS: 8,
  SPECIAL_PENSION: 9,
  RESULT: 10,
} as const;

export type StepId = (typeof FutureMeStep)[keyof typeof FutureMeStep];

const { YOU, AGE_55, AGE_60, AGE_65, AGE_66_PLUS, COSTS, SPECIAL_PENSION, RESULT } = FutureMeStep;

const ALL_STEPS: StepId[] = [
  YOU,
  AGE_55,
  AGE_60,
  AGE_65,
  AGE_66_PLUS,
  COSTS,
  SPECIAL_PENSION,
  RESULT,
];

const SECOND_PILLAR_PAYOUT_YEARS_BEFORE_PENSION = 5;

const ORDER_SPECIAL_PENSION_BEFORE_AGE_55 = 3.5;
const ORDER_SPECIAL_PENSION_BEFORE_AGE_60 = 4.5;
const ORDER_RETIRING_BEFORE_AGE_60 = 4.6;
const ORDER_SPECIAL_PENSION_BEFORE_PENSION_AGE = 5.5;
const ORDER_SPECIAL_PENSION_AT_PENSION_AGE = 5.9;

const MEASURED_RESULT_STEP = 9;

export interface StepPlanInput {
  birthYear: number;
  pensionAgeYears?: number;
  earlyRetirementYears: number;
  hasSpecialPension: boolean;
  specialPensionStartAge?: number;
  savesInSecondPillar: boolean;
  thirdPillarJoined: 'before' | 'after' | 'none';
}

export const isStepSkipped = (step: StepId, input: StepPlanInput): boolean => {
  switch (step) {
    case AGE_55:
      return input.thirdPillarJoined !== 'before';
    case SPECIAL_PENSION:
      return !input.hasSpecialPension;
    default:
      return false;
  }
};

const specialPensionOrder = (input: StepPlanInput): number => {
  const pensionAgeYears = retirementYears(input);
  const startAge = Math.min(input.specialPensionStartAge ?? pensionAgeYears, pensionAgeYears);
  if (startAge < THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021) {
    return ORDER_SPECIAL_PENSION_BEFORE_AGE_55;
  }
  if (startAge < pensionAgeYears - SECOND_PILLAR_PAYOUT_YEARS_BEFORE_PENSION) {
    return ORDER_SPECIAL_PENSION_BEFORE_AGE_60;
  }
  return startAge < pensionAgeYears
    ? ORDER_SPECIAL_PENSION_BEFORE_PENSION_AGE
    : ORDER_SPECIAL_PENSION_AT_PENSION_AGE;
};

export const stepOrder = (step: StepId, input: StepPlanInput): number => {
  if (step === AGE_65) {
    return input.earlyRetirementYears > SECOND_PILLAR_PAYOUT_YEARS_BEFORE_PENSION
      ? ORDER_RETIRING_BEFORE_AGE_60
      : step;
  }
  return step === SPECIAL_PENSION ? specialPensionOrder(input) : step;
};

export const shownSteps = (input: StepPlanInput): StepId[] =>
  ALL_STEPS.filter((step) => !isStepSkipped(step, input)).sort(
    (a, b) => stepOrder(a, input) - stepOrder(b, input),
  );

export const neighbouringStep = (steps: StepId[], current: StepId, direction: 1 | -1): StepId => {
  const position = steps.indexOf(current) + direction;
  return steps[Math.max(0, Math.min(steps.length - 1, position))];
};

export const measuredStep = (step: StepId): number | null => {
  if (step === SPECIAL_PENSION) {
    return null;
  }
  return step === RESULT ? MEASURED_RESULT_STEP : step;
};
