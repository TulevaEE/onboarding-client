import { CURRENT_YEAR, pensionAge, Sex } from './engine/pension';
import { parseBirthYear, YouPrefill } from './prefill';
import { StepPlanInput } from './steps';

export const FALLBACK_BIRTH_YEAR = 1980;
export const PENSION_AGE_OPTIONS = [65, 66, 67, 68, 69, 70];
export const SECOND_PILLAR_RATE_OPTIONS = ['0', '0.02', '0.04', '0.06'];
export const FUND_RETURNS = { cons: 0, mix: 0.02, index: 0.04 };

const UNKNOWN_SEX: Sex = 'X';
const DEFAULT_SECOND_PILLAR_RATE = '0.02';
const EARLIEST_THIRD_PILLAR_BENEFIT_AGE = 55;
const LATER_THIRD_PILLAR_BENEFIT_AGE = 60;
const MAX_PENSION_AGE = Math.max(...PENSION_AGE_OPTIONS);

export type FundKey = keyof typeof FUND_RETURNS;
export type ThirdPillarJoined = 'before' | 'after' | 'none';
export type FieldProblem = 'empty' | 'min' | 'range';

export type YouField =
  | 'birthYear'
  | 'firstPillarMonthly'
  | 'grossMonthly'
  | 'secondPillarAmount'
  | 'thirdPillarAmount'
  | 'thirdPillarMonthly';

export type YouSectionId = 'me' | 'state' | 'secondPillar' | 'thirdPillar';

export interface YouAnswers {
  birthYear: string;
  sex: Sex;
  pensionAgeYears: string;
  firstPillarMonthly: string;
  grossMonthly: string;
  secondPillarRate: string;
  secondPillarAmount: string;
  secondPillarFund: FundKey;
  thirdPillarJoined: ThirdPillarJoined;
  thirdPillarAmount: string;
  thirdPillarMonthly: string;
  thirdPillarOpenAge: string;
  thirdPillarFund: FundKey;
}

export const FIELDS_BY_SECTION: Record<YouSectionId, YouField[]> = {
  me: ['birthYear'],
  state: ['firstPillarMonthly'],
  secondPillar: ['grossMonthly', 'secondPillarAmount'],
  thirdPillar: ['thirdPillarAmount', 'thirdPillarMonthly'],
};

export const SECTION_IDS = Object.keys(FIELDS_BY_SECTION) as YouSectionId[];

export const initialAnswers = (prefill: YouPrefill): YouAnswers => ({
  birthYear: prefill.birthYear?.toString() ?? '',
  sex: prefill.sex ?? UNKNOWN_SEX,
  pensionAgeYears: '',
  firstPillarMonthly: '',
  grossMonthly: '',
  secondPillarRate: prefill.secondPillarRate ?? DEFAULT_SECOND_PILLAR_RATE,
  secondPillarAmount: '',
  secondPillarFund: 'mix',
  thirdPillarJoined: 'after',
  thirdPillarAmount: '',
  thirdPillarMonthly: '',
  thirdPillarOpenAge: '',
  thirdPillarFund: 'mix',
});

export const birthYearOrFallback = (answers: YouAnswers): number =>
  parseBirthYear(answers.birthYear) ?? FALLBACK_BIRTH_YEAR;

export const effectivePensionAge = (answers: YouAnswers): number =>
  Number(answers.pensionAgeYears) ||
  Math.min(MAX_PENSION_AGE, pensionAge(birthYearOrFallback(answers)).years);

export const amountOf = (typed: string): number => Math.max(0, parseFloat(typed) || 0);

const isThirdPillarBalanceAsked = (answers: YouAnswers): boolean =>
  answers.thirdPillarJoined !== 'none';

export const fieldProblem = (answers: YouAnswers, field: YouField): FieldProblem | null => {
  const typed = answers[field].trim();
  if (field === 'birthYear') {
    if (typed === '') {
      return 'empty';
    }
    return parseBirthYear(typed) === null ? 'range' : null;
  }
  if (typed === '') {
    return 'empty';
  }
  return Number(typed) < 0 || Number.isNaN(Number(typed)) ? 'min' : null;
};

const isFieldAsked = (answers: YouAnswers, field: YouField): boolean =>
  field !== 'thirdPillarAmount' || isThirdPillarBalanceAsked(answers);

export const blockedFieldsOf = (answers: YouAnswers, section: YouSectionId): YouField[] =>
  FIELDS_BY_SECTION[section].filter(
    (field) => isFieldAsked(answers, field) && fieldProblem(answers, field) !== null,
  );

export const blockedFields = (answers: YouAnswers): YouField[] =>
  SECTION_IDS.flatMap((section) => blockedFieldsOf(answers, section));

const isThirdPillarEarlyWithdrawalAvailable = (answers: YouAnswers): boolean => {
  const birthYear = birthYearOrFallback(answers);
  const currentAge = CURRENT_YEAR - birthYear;
  const benefitStartsAtAge =
    answers.thirdPillarJoined === 'before'
      ? EARLIEST_THIRD_PILLAR_BENEFIT_AGE
      : LATER_THIRD_PILLAR_BENEFIT_AGE;
  const lastEarlyAge = Math.min(benefitStartsAtAge, effectivePensionAge(answers)) - 1;
  return (
    isThirdPillarBalanceAsked(answers) &&
    amountOf(answers.thirdPillarAmount) > 0 &&
    currentAge <= lastEarlyAge
  );
};

export const toStepPlanInput = (answers: YouAnswers): StepPlanInput => ({
  birthYear: birthYearOrFallback(answers),
  pensionAgeYears: effectivePensionAge(answers),
  earlyRetirementYears: 0,
  hasSpecialPension: false,
  savesInSecondPillar:
    amountOf(answers.secondPillarAmount) > 0 || Number(answers.secondPillarRate) > 0,
  thirdPillarJoined: answers.thirdPillarJoined,
  thirdPillarEarlyWithdrawalAvailable: isThirdPillarEarlyWithdrawalAvailable(answers),
  thirdPillarEarlyWithdrawalTaken: false,
});
