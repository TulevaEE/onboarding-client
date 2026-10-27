import { CURRENT_YEAR, earlyYears, KidsInput, pensionAge, Sex } from './engine/pension';
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
const MIN_CHILD_BIRTH_YEAR = 1930;
const YEARS_RAISING_A_CHILD = 8;
const MAX_EARLY_YEARS_FOR_CHILDREN = 5;
const MAX_CHILD_ROWS = 20;
const CHILD_BIRTH_YEAR_TEXT = /^\d{4}$/;
const FLEXIBLE_PENSION_MAX_YEARS_EARLY = 5;
const SPECIAL_PENSION_START_AGE_LIMITS = { min: 35, max: 70 };
const WORK_YEARS_LIMITS = { min: 0, max: 50 };

export type FundKey = keyof typeof FUND_RETURNS;
export type ThirdPillarJoined = 'before' | 'after' | 'none';
export type HazardList = 'no' | 'list1' | 'list2';
export type FieldProblem = 'empty' | 'min' | 'range';

export type YouField =
  | 'birthYear'
  | 'firstPillarMonthly'
  | 'grossMonthly'
  | 'secondPillarAmount'
  | 'thirdPillarAmount'
  | 'thirdPillarMonthly'
  | 'kidsCount'
  | 'hazardYears'
  | 'rescueYears'
  | 'specialPensionStartAge';

export type OptionalSectionId = 'kids' | 'work';
export type YouSectionId = 'me' | 'state' | 'secondPillar' | 'thirdPillar' | OptionalSectionId;

export const OPTIONAL_SECTION_IDS: OptionalSectionId[] = ['kids', 'work'];

export interface YouAnswers extends KidsAnswers, WorkAnswers {
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
  earlyYearsPicked: string;
}

interface KidsAnswers {
  kidsAdded: boolean;
  kidsCount: string;
  kidsBirthYears: string[];
  kidsDisabled: boolean;
  kidsEarlyUser: 'me' | 'other';
}

interface WorkAnswers {
  workAdded: boolean;
  hazardList: HazardList;
  hazardYears: string;
  undergroundYears: string;
  hasRescue: boolean;
  rescueYears: string;
  hasSpecialPension: boolean;
  specialPensionStartAge: string;
  isCivilServant: boolean;
  hasOtherSpecialCase: boolean;
}

type FieldLimits = { min: number; max?: number };

const FIELD_LIMITS: Partial<Record<YouField, FieldLimits>> = {
  kidsCount: { min: 0 },
  hazardYears: WORK_YEARS_LIMITS,
  rescueYears: WORK_YEARS_LIMITS,
  specialPensionStartAge: SPECIAL_PENSION_START_AGE_LIMITS,
};

export const limitsOf = (field: YouField): FieldLimits | undefined => FIELD_LIMITS[field];

const OPTIONAL_DEFAULTS: { kids: KidsAnswers; work: WorkAnswers } = {
  kids: {
    kidsAdded: false,
    kidsCount: '1',
    kidsBirthYears: [],
    kidsDisabled: false,
    kidsEarlyUser: 'me',
  },
  work: {
    workAdded: false,
    hazardList: 'no',
    hazardYears: '10',
    undergroundYears: '0',
    hasRescue: false,
    rescueYears: '',
    hasSpecialPension: false,
    specialPensionStartAge: '',
    isCivilServant: false,
    hasOtherSpecialCase: false,
  },
};

export const FIELDS_BY_SECTION: Record<YouSectionId, YouField[]> = {
  me: ['birthYear'],
  state: ['firstPillarMonthly'],
  secondPillar: ['grossMonthly', 'secondPillarAmount'],
  thirdPillar: ['thirdPillarAmount', 'thirdPillarMonthly'],
  kids: ['kidsCount'],
  work: ['hazardYears', 'rescueYears', 'specialPensionStartAge'],
};

export const SECTION_IDS = Object.keys(FIELDS_BY_SECTION) as YouSectionId[];

export const initialAnswers = (prefill: YouPrefill): YouAnswers =>
  ({
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
    ...OPTIONAL_DEFAULTS.kids,
    ...OPTIONAL_DEFAULTS.work,
    earlyYearsPicked: '',
  } as YouAnswers);

export const removeOptionalSection = (
  answers: YouAnswers,
  section: OptionalSectionId,
): YouAnswers => ({
  ...answers,
  ...OPTIONAL_DEFAULTS[section],
  earlyYearsPicked: '',
});

export const birthYearOrFallback = (answers: YouAnswers): number =>
  parseBirthYear(answers.birthYear) ?? FALLBACK_BIRTH_YEAR;

export const effectivePensionAge = (answers: YouAnswers): number =>
  Number(answers.pensionAgeYears) ||
  Math.min(MAX_PENSION_AGE, pensionAge(birthYearOrFallback(answers)).years);

export const amountOf = (typed: string): number => Math.max(0, parseFloat(typed) || 0);

const isThirdPillarBalanceAsked = (answers: YouAnswers): boolean =>
  answers.thirdPillarJoined !== 'none';

export const isSpecialPensionOn = (answers: YouAnswers): boolean =>
  answers.workAdded && answers.hasSpecialPension;

export const chosenSpecialCases = (answers: YouAnswers): number =>
  [
    answers.hazardList !== 'no',
    answers.hasSpecialPension,
    answers.hasRescue,
    answers.isCivilServant,
    answers.hasOtherSpecialCase,
  ].filter(Boolean).length;

export const childRows = (answers: YouAnswers): number =>
  answers.kidsAdded
    ? Math.min(MAX_CHILD_ROWS, Math.max(0, parseInt(answers.kidsCount, 10) || 0))
    : 0;

export const maxChildBirthYear = (answers: YouAnswers): number =>
  birthYearOrFallback(answers) + effectivePensionAge(answers);

const validChildBirthYear = (typed: string, maxYear: number): number | null => {
  const year = Number(typed.trim());
  return CHILD_BIRTH_YEAR_TEXT.test(typed.trim()) && year >= MIN_CHILD_BIRTH_YEAR && year <= maxYear
    ? year
    : null;
};

export const isChildBirthYearInvalid = (answers: YouAnswers, index: number): boolean => {
  const typed = (answers.kidsBirthYears[index] ?? '').trim();
  return typed !== '' && validChildBirthYear(typed, maxChildBirthYear(answers)) === null;
};

export const hasChildWithoutBirthYear = (answers: YouAnswers): boolean =>
  Array.from({ length: childRows(answers) }).some(
    (_, index) =>
      validChildBirthYear(answers.kidsBirthYears[index] ?? '', maxChildBirthYear(answers)) === null,
  );

const kidsEarlyInput = (
  earlyUser: YouAnswers['kidsEarlyUser'],
  isDisabled: boolean,
  counted: number,
): KidsInput => ({
  b1991: counted,
  earlyUser,
  disabled: isDisabled && counted > 0,
});

const kidsRetirement = (answers: YouAnswers, earlyUser: YouAnswers['kidsEarlyUser']) => {
  const maxYear = maxChildBirthYear(answers);
  const birthYears = Array.from({ length: childRows(answers) }, (_, index) =>
    validChildBirthYear(answers.kidsBirthYears[index] ?? '', maxYear),
  );
  const unknown = birthYears.filter((year) => year === null).length;
  const known = birthYears.filter((year): year is number => year !== null);
  const pensionYear = birthYearOrFallback(answers) + effectivePensionAge(answers);
  const countedBy = (retirementYear: number) =>
    known.filter((year) => year + YEARS_RAISING_A_CHILD <= retirementYear).length + unknown;
  const coversRetiringIn = (retirementYear: number) =>
    earlyYears({
      kids: kidsEarlyInput(earlyUser, answers.kidsDisabled, countedBy(retirementYear)),
    }) >=
    pensionYear - retirementYear;
  const earliestYearFirst = Array.from(
    { length: MAX_EARLY_YEARS_FOR_CHILDREN + 1 },
    (_, offset) => pensionYear - MAX_EARLY_YEARS_FOR_CHILDREN + offset,
  );
  const retirementYear = earliestYearFirst.find(coversRetiringIn) ?? pensionYear;
  const counted = countedBy(retirementYear);
  return {
    counted,
    late: known.length - (counted - unknown),
    retirementYear,
    yearsEarly: pensionYear - retirementYear,
  };
};

export const countedKids = (
  answers: YouAnswers,
): { counted: number; late: number; lateYear: number } => {
  const { counted, late, retirementYear } = kidsRetirement(answers, answers.kidsEarlyUser);
  return { counted, late, lateYear: retirementYear };
};

const kidsRightFor = (answers: YouAnswers, earlyUser: YouAnswers['kidsEarlyUser']): number =>
  answers.kidsAdded ? kidsRetirement(answers, earlyUser).yearsEarly : 0;

export const isKidsRightAvailableToSelf = (answers: YouAnswers): boolean =>
  kidsRightFor(answers, 'me') > 0;

export const earlyRightSources = (
  answers: YouAnswers,
): { kids: number; hazard: number; rescue: number } => ({
  kids: kidsRightFor(answers, answers.kidsEarlyUser),
  hazard:
    answers.workAdded && answers.hazardList !== 'no'
      ? earlyYears({
          hazard: answers.hazardList,
          hazardYears: parseFloat(answers.hazardYears) || 0,
        })
      : 0,
  rescue:
    answers.workAdded && answers.hasRescue
      ? earlyYears({ rescueYears: parseInt(answers.rescueYears, 10) || 0 })
      : 0,
});

export const earlyRetirementRight = (answers: YouAnswers): number =>
  Math.max(...Object.values(earlyRightSources(answers)));

export const isSpecialPensionOnly = (answers: YouAnswers): boolean =>
  isSpecialPensionOn(answers) && earlyRetirementRight(answers) === 0;

export const maxEarlyYearsOption = (answers: YouAnswers): number =>
  Math.max(FLEXIBLE_PENSION_MAX_YEARS_EARLY, earlyRetirementRight(answers));

export const earlyRetirementYears = (answers: YouAnswers): number => {
  const right = earlyRetirementRight(answers);
  if (isSpecialPensionOn(answers) && right === 0) {
    return 0;
  }
  const picked = answers.earlyYearsPicked;
  if (picked === '') {
    return right;
  }
  const years = Math.max(0, parseInt(picked, 10) || 0);
  return years > maxEarlyYearsOption(answers) ? right : years;
};

export const pensionAgeValue = (answers: YouAnswers): number =>
  effectivePensionAge(answers) - earlyRetirementYears(answers);

const specialPensionStartAgeOf = (answers: YouAnswers): number | undefined => {
  const typed = answers.specialPensionStartAge.trim();
  if (!isSpecialPensionOn(answers) || typed === '') {
    return undefined;
  }
  const { min, max } = SPECIAL_PENSION_START_AGE_LIMITS;
  return Math.min(max, Math.max(min, parseInt(typed, 10) || 0));
};

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
  const limits = FIELD_LIMITS[field] ?? { min: 0 };
  const typedNumber = Number(typed);
  if (Number.isNaN(typedNumber) || typedNumber < limits.min) {
    return limits.max === undefined ? 'min' : 'range';
  }
  return limits.max !== undefined && typedNumber > limits.max ? 'range' : null;
};

const isFieldAsked = (answers: YouAnswers, field: YouField): boolean => {
  switch (field) {
    case 'thirdPillarAmount':
      return isThirdPillarBalanceAsked(answers);
    case 'kidsCount':
      return answers.kidsAdded;
    case 'hazardYears':
      return answers.workAdded && answers.hazardList !== 'no';
    case 'rescueYears':
      return answers.workAdded && answers.hasRescue;
    case 'specialPensionStartAge':
      return isSpecialPensionOn(answers);
    default:
      return true;
  }
};

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
  earlyRetirementYears: earlyRetirementYears(answers),
  hasSpecialPension: isSpecialPensionOn(answers),
  specialPensionStartAge: specialPensionStartAgeOf(answers),
  savesInSecondPillar:
    amountOf(answers.secondPillarAmount) > 0 || Number(answers.secondPillarRate) > 0,
  thirdPillarJoined: answers.thirdPillarJoined,
  thirdPillarEarlyWithdrawalAvailable: isThirdPillarEarlyWithdrawalAvailable(answers),
  thirdPillarEarlyWithdrawalTaken: false,
});
