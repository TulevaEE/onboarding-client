import { Age65Answers, initialAge65, pensionKind, workUntilOf } from './age65Answers';
import { Age66Answers, initialAge66 } from './age66Answers';
import lifeTableData from './engine/lifeTable.json';
import {
  CURRENT_YEAR,
  FirstPillarChoice,
  LifeTable,
  PensionInput,
  retirementYears,
  SCENARIOS,
  simulate,
  SimulationResult,
} from './engine/pension';
import { kidsInputOf } from './kidsInput';
import { StepPlanInput } from './steps';
import { amountOf, rescueBasisOf, YouAnswers } from './youAnswers';
import { retirementAge } from './planAges';

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

const newSalaryOf = (answers: SpecialPensionAnswers, plan: StepPlanInput): number | undefined =>
  isPayAsked(answers, plan) && answers.pay === 'change' && answers.gross.trim() !== ''
    ? amountOf(answers.gross)
    : undefined;

export const secondPillarMonthly = (
  you: YouAnswers,
  answers: SpecialPensionAnswers,
  plan: StepPlanInput,
): number => {
  const rate = Number(you.secondPillarRate) || 0;
  const salary = newSalaryOf(answers, plan) ?? amountOf(you.grossMonthly);
  return rate > 0 ? salary * (rate + STATE_SECOND_PILLAR_RATE) : 0;
};

export const pensionInputOf = (
  answers: SpecialPensionAnswers,
  you: YouAnswers,
  plan: StepPlanInput,
  age65: Age65Answers,
  age66: Age66Answers,
): PensionInput => {
  const isStarted = isSpecialPensionStarted(plan);
  const isHazardous = you.workAdded && you.hazardList !== 'no';
  return {
    birthYear: plan.birthYear,
    sex: you.sex,
    p1Monthly: amountOf(you.firstPillarMonthly),
    p2: amountOf(you.secondPillarAmount),
    p3: 0,
    needMonthly: 0,
    realReturn: 0,
    pensionAgeYears: plan.pensionAgeYears,
    grossMonthly: amountOf(you.grossMonthly),
    p2Rate: Number(you.secondPillarRate) || 0,
    soodus: plan.earlyRetirementYears,
    flexEarly: pensionKind(you) === 'flexible' ? plan.earlyRetirementYears : 0,
    kids: kidsInputOf(you),
    rescueBasis: rescueBasisOf(you),
    hazard: isHazardous ? you.hazardList : 'no',
    hazardYears: isHazardous ? parseFloat(you.hazardYears) || 0 : 0,
    undergroundYears: isHazardous ? parseInt(you.undergroundYears, 10) || 0 : 0,
    rescueYears: you.workAdded && you.hasRescue ? parseInt(you.rescueYears, 10) || 0 : 0,
    civilYears: you.workAdded && you.isCivilServant ? parseInt(you.civilYears, 10) || 0 : 0,
    spHas: true,
    spMonthly: amountOf(answers.monthly),
    spStartAge: plan.specialPensionStartAge,
    spWork: isStarted ? amountOf(you.grossMonthly) > 0 : answers.work === 'yes',
    spGross: newSalaryOf(answers, plan),
    workOn: age65.work === 'yes',
    workUntil: workUntilOf(age65, plan),
    firstPillarChoice: age65.firstPillarChoice ?? undefined,
    firstPillarChoicePa: age66.firstPillarChoicePa ?? undefined,
  };
};

export const firstPillarComparison = (
  answers: SpecialPensionAnswers,
  you: YouAnswers,
  plan: StepPlanInput,
  age65: Age65Answers = initialAge65(),
  age66: Age66Answers = initialAge66(),
): SimulationResult['firstPillar'] =>
  amountOf(answers.monthly) > 0
    ? simulate(pensionInputOf(answers, you, plan, age65, age66), lifeTable, SCENARIOS[0])
        .firstPillar
    : null;

export const chosenFirstPillar = (
  choice: FirstPillarChoice | null,
  comparison: { larger: FirstPillarChoice },
): FirstPillarChoice => choice ?? comparison.larger;
