import { pensionKind, retirementAge } from './age65Answers';
import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  LifeTable,
  PensionInput,
  retirementYears,
  SCENARIOS,
  simulate,
  SimulationResult,
} from './engine/pension';
import { StepPlanInput } from './steps';
import { amountOf, YouAnswers } from './youAnswers';

const STATE_SECOND_PILLAR_RATE = 0.04;
const lifeTable: LifeTable = lifeTableData;

export interface SpecialPensionAnswers {
  monthly: string;
  work: 'yes' | 'no';
  pay: 'same' | 'change';
  gross: string;
}

export const initialSpecialPension = (): SpecialPensionAnswers => ({
  monthly: '',
  work: 'yes',
  pay: 'same',
  gross: '',
});

export const specialPensionStartAge = (plan: StepPlanInput): number =>
  plan.specialPensionStartAge ?? retirementYears(plan);

export const isSpecialPensionStarted = (plan: StepPlanInput): boolean =>
  specialPensionStartAge(plan) < CURRENT_YEAR - plan.birthYear;

export const isWorkAsked = (plan: StepPlanInput): boolean =>
  specialPensionStartAge(plan) < retirementAge(plan) && !isSpecialPensionStarted(plan);

export const isPayAsked = (answers: SpecialPensionAnswers, plan: StepPlanInput): boolean =>
  isWorkAsked(plan) && answers.work === 'yes';

export const secondPillarMonthly = (you: YouAnswers): number => {
  const rate = Number(you.secondPillarRate) || 0;
  return rate > 0 ? amountOf(you.grossMonthly) * (rate + STATE_SECOND_PILLAR_RATE) : 0;
};

const pensionInputOf = (
  answers: SpecialPensionAnswers,
  you: YouAnswers,
  plan: StepPlanInput,
): PensionInput => {
  const isStarted = isSpecialPensionStarted(plan);
  const isHazardous = you.workAdded && you.hazardList !== 'no';
  return {
    birthYear: plan.birthYear,
    sex: you.sex,
    p1Monthly: amountOf(you.firstPillarMonthly),
    p2: 0,
    p3: 0,
    needMonthly: 0,
    realReturn: 0,
    pensionAgeYears: plan.pensionAgeYears,
    grossMonthly: amountOf(you.grossMonthly),
    p2Rate: Number(you.secondPillarRate) || 0,
    soodus: plan.earlyRetirementYears,
    flexEarly: pensionKind(you) === 'flexible' ? plan.earlyRetirementYears : 0,
    hazard: isHazardous ? you.hazardList : 'no',
    hazardYears: isHazardous ? parseFloat(you.hazardYears) || 0 : 0,
    undergroundYears: isHazardous ? parseInt(you.undergroundYears, 10) || 0 : 0,
    rescueYears: you.workAdded && you.hasRescue ? parseInt(you.rescueYears, 10) || 0 : 0,
    spHas: true,
    spMonthly: amountOf(answers.monthly),
    spStartAge: plan.specialPensionStartAge,
    spWork: isStarted ? amountOf(you.grossMonthly) > 0 : answers.work === 'yes',
    spGross:
      isPayAsked(answers, plan) && answers.pay === 'change' && answers.gross.trim() !== ''
        ? amountOf(answers.gross)
        : undefined,
  };
};

export const firstPillarComparison = (
  answers: SpecialPensionAnswers,
  you: YouAnswers,
  plan: StepPlanInput,
): SimulationResult['firstPillar'] =>
  amountOf(answers.monthly) > 0
    ? simulate(pensionInputOf(answers, you, plan), lifeTable, SCENARIOS[0]).firstPillar
    : null;
