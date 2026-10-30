import {
  AVG_OLD_AGE_PENSION,
  earlyYears,
  KidsInput,
  PensionInput,
  ServiceIncrease,
  serviceIncreaseOf,
  Sex,
} from './engine/pension';
import { startingRetirementAge } from '../pensionCalculator/calculation';
import { isParentalPaymentMonthsAsked, PARENTAL_PAYMENT_MONTHS } from './kidsPrefill';
import { parseBirthYear, YouPrefill } from './prefill';
import { StepPlanInput } from './steps';

export const FALLBACK_BIRTH_YEAR = 1980;
export const PENSION_AGE_OPTIONS = [65, 66, 67, 68, 69, 70];
export const SECOND_PILLAR_RATE_OPTIONS = ['0', '0.02', '0.04', '0.06'];
export const PREFILLED_FIRST_PILLAR_MONTHLY = String(Math.round(AVG_OLD_AGE_PENSION));

const UNKNOWN_SEX: Sex = 'X';
const DEFAULT_SECOND_PILLAR_RATE = '0.02';
const DEFAULT_RETURN_PERCENT = 0;
const MAX_PENSION_AGE = Math.max(...PENSION_AGE_OPTIONS);
const MIN_CHILD_BIRTH_YEAR = 1930;
const YEARS_RAISING_A_CHILD = 8;
const MAX_EARLY_YEARS_FOR_CHILDREN = 5;
const MAX_CHILD_ROWS = 20;
const CHILD_BIRTH_YEAR_TEXT = /^\d{4}$/;
const FLEXIBLE_PENSION_MAX_YEARS_EARLY = 5;
const SPECIAL_PENSION_START_AGE_LIMITS = { min: 35, max: 70 };
const WORK_YEARS_LIMITS = { min: 0, max: 50 };
const RETURN_PERCENT_LIMITS = { min: -10, max: 10 };

export const RETURN_PERCENT_OPTIONS = Array.from(
  { length: RETURN_PERCENT_LIMITS.max - RETURN_PERCENT_LIMITS.min + 1 },
  (_, index) => RETURN_PERCENT_LIMITS.min + index,
);

export type ThirdPillarJoined = 'before' | 'after' | 'none';
export type ThirdPillarPlan = 'keep' | 'fund' | 'lump';
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
  | 'civilYears'
  | 'specialPensionStartAge';

export type OptionalSectionId = 'kids' | 'work';
export type YouSectionId = 'me' | 'state' | 'secondPillar' | 'thirdPillar' | OptionalSectionId;

export const OPTIONAL_SECTION_IDS: OptionalSectionId[] = ['kids', 'work'];

export interface YouAnswers extends KidsAnswers, WorkAnswers {
  birthYear: string;
  sex: Sex;
  birthMonth: number | null;
  pensionAgeYears: string;
  registerPensionAge: number | null;
  firstPillarMonthly: string;
  grossMonthly: string;
  secondPillarRate: string;
  secondPillarAmount: string;
  secondPillarReturnPercent: number;
  thirdPillarJoined: ThirdPillarJoined;
  thirdPillarAmount: string;
  thirdPillarMonthly: string;
  thirdPillarOpenAge: string;
  thirdPillarReturnPercent: number;
  thirdPillarPlan: ThirdPillarPlan;
  earlyYearsPicked: string;
  rescueBasis: RescueBasis;
}

export type KidsUser = 'me' | 'other';
export type RescueBasis = 'mix' | 'pension' | 'toetus';

interface KidsAnswers {
  kidsAdded: boolean;
  kidsCount: string;
  kidsBirthYears: string[];
  kidsBirthMonths: string[];
  kidsIIMonths: string[];
  kidsDisabled: boolean[];
  kidsEarlyUser: KidsUser;
  kidsSupUser: KidsUser;
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
  civilYears: string;
  hasOtherSpecialCase: boolean;
}

type FieldLimits = { min: number; max?: number };

const FIELD_LIMITS: Partial<Record<YouField, FieldLimits>> = {
  kidsCount: { min: 0 },
  hazardYears: WORK_YEARS_LIMITS,
  rescueYears: WORK_YEARS_LIMITS,
  civilYears: WORK_YEARS_LIMITS,
  specialPensionStartAge: SPECIAL_PENSION_START_AGE_LIMITS,
};

export const limitsOf = (field: YouField): FieldLimits | undefined => FIELD_LIMITS[field];

const OPTIONAL_DEFAULTS: { kids: KidsAnswers; work: WorkAnswers } = {
  kids: {
    kidsAdded: false,
    kidsCount: '1',
    kidsBirthYears: [],
    kidsBirthMonths: [],
    kidsIIMonths: [],
    kidsDisabled: [],
    kidsEarlyUser: 'me',
    kidsSupUser: 'me',
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
    civilYears: '',
    hasOtherSpecialCase: false,
  },
};

export const FIELDS_BY_SECTION: Record<YouSectionId, YouField[]> = {
  me: ['birthYear'],
  state: ['firstPillarMonthly'],
  secondPillar: ['grossMonthly', 'secondPillarAmount'],
  thirdPillar: ['thirdPillarAmount', 'thirdPillarMonthly'],
  kids: ['kidsCount'],
  work: ['hazardYears', 'rescueYears', 'civilYears', 'specialPensionStartAge'],
};

export const SECTION_IDS = Object.keys(FIELDS_BY_SECTION) as YouSectionId[];

export const initialAnswers = (prefill: YouPrefill): YouAnswers =>
  ({
    birthYear: prefill.birthYear?.toString() ?? '',
    sex: prefill.sex ?? UNKNOWN_SEX,
    birthMonth: prefill.birthMonth ?? null,
    pensionAgeYears: '',
    registerPensionAge: prefill.registerPensionAge ?? null,
    firstPillarMonthly: PREFILLED_FIRST_PILLAR_MONTHLY,
    grossMonthly: prefill.grossMonthly ?? '',
    secondPillarRate: prefill.secondPillarRate ?? DEFAULT_SECOND_PILLAR_RATE,
    secondPillarAmount: prefill.secondPillarAmount ?? '',
    secondPillarReturnPercent: DEFAULT_RETURN_PERCENT,
    thirdPillarJoined: prefill.thirdPillarJoined ?? 'after',
    thirdPillarAmount: prefill.thirdPillarAmount ?? '',
    thirdPillarMonthly: prefill.thirdPillarMonthly ?? '',
    thirdPillarOpenAge: '',
    thirdPillarReturnPercent: DEFAULT_RETURN_PERCENT,
    thirdPillarPlan: 'keep',
    ...OPTIONAL_DEFAULTS.kids,
    ...(prefill.kids && {
      kidsAdded: true,
      kidsCount: String(prefill.kids.birthYears.length),
      kidsBirthYears: prefill.kids.birthYears.map(String),
      kidsBirthMonths: prefill.kids.birthMonths.map(String),
      kidsIIMonths: prefill.kids.iiMonths,
    }),
    ...OPTIONAL_DEFAULTS.work,
    earlyYearsPicked: '',
    rescueBasis: 'mix',
  } as YouAnswers);

const PREFILLABLE_FIELDS = [
  'birthYear',
  'sex',
  'grossMonthly',
  'secondPillarRate',
  'secondPillarAmount',
  'thirdPillarAmount',
  'thirdPillarMonthly',
  'thirdPillarJoined',
] as const;

export type PrefilledField = (typeof PREFILLABLE_FIELDS)[number] | 'firstPillarMonthly';

export const prefilledFields = (
  answers: YouAnswers,
  prefill: YouPrefill,
): ReadonlySet<PrefilledField> =>
  new Set<PrefilledField>([
    ...PREFILLABLE_FIELDS.filter(
      (field) => prefill[field] != null && answers[field] === String(prefill[field]),
    ),
    ...(answers.firstPillarMonthly === PREFILLED_FIRST_PILLAR_MONTHLY
      ? (['firstPillarMonthly'] as const)
      : []),
  ]);

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
  Math.min(
    MAX_PENSION_AGE,
    startingRetirementAge(answers.registerPensionAge ?? undefined, birthYearOrFallback(answers)),
  );

export const rateOf = (percent: number): number => percent / 100;

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

export const isChildIIMonthsInvalid = (answers: YouAnswers, index: number): boolean => {
  const typed = (answers.kidsIIMonths[index] ?? '').trim();
  return typed !== '' && !(/^\d+$/.test(typed) && Number(typed) <= PARENTAL_PAYMENT_MONTHS);
};

export const isChildIIMonthsAsked = (
  answers: YouAnswers,
  index: number,
  now: Date = new Date(),
): boolean =>
  isParentalPaymentMonthsAsked(
    {
      year: Number((answers.kidsBirthYears[index] ?? '').trim()),
      month: parseInt(answers.kidsBirthMonths[index] ?? '', 10) || 0,
    },
    now,
  );

export const firstInvalidChildIIMonths = (
  answers: YouAnswers,
  now: Date = new Date(),
): number | undefined =>
  Array.from({ length: childRows(answers) }, (_, index) => index).find(
    (index) => isChildIIMonthsAsked(answers, index, now) && isChildIIMonthsInvalid(answers, index),
  );

export const maxChildBirthYear = (answers: YouAnswers): number =>
  birthYearOrFallback(answers) + effectivePensionAge(answers);

export const validChildBirthYear = (typed: string, maxYear: number): number | null => {
  const year = Number(typed.trim());
  return CHILD_BIRTH_YEAR_TEXT.test(typed.trim()) && year >= MIN_CHILD_BIRTH_YEAR && year <= maxYear
    ? year
    : null;
};

export const isChildBirthYearInvalid = (answers: YouAnswers, index: number): boolean => {
  const typed = (answers.kidsBirthYears[index] ?? '').trim();
  return typed !== '' && validChildBirthYear(typed, maxChildBirthYear(answers)) === null;
};

const typedChildBirthYears = (answers: YouAnswers): string[] =>
  Array.from({ length: childRows(answers) }, (_, index) =>
    (answers.kidsBirthYears[index] ?? '').trim(),
  );

const kidsEarlyInput = (earlyUser: KidsUser, hasDisabled: boolean, counted: number): KidsInput => ({
  b1991: counted,
  earlyUser,
  disabled: hasDisabled,
});

const kidsRetirement = (answers: YouAnswers, earlyUser: KidsUser) => {
  const maxYear = maxChildBirthYear(answers);
  const typed = typedChildBirthYears(answers);
  const known = typed
    .map((year) => validChildBirthYear(year, maxYear))
    .filter((year): year is number => year !== null);
  const pensionYear = birthYearOrFallback(answers) + effectivePensionAge(answers);
  const countedBy = (retirementYear: number) =>
    known.filter((year) => year + YEARS_RAISING_A_CHILD <= retirementYear).length;
  const isRaisedBy = (typedYear: string, retirementYear: number) => {
    const year = validChildBirthYear(typedYear, maxYear);
    return year !== null && year + YEARS_RAISING_A_CHILD <= retirementYear;
  };
  const hasDisabledBy = (retirementYear: number) =>
    typed.some((year, index) => answers.kidsDisabled[index] && isRaisedBy(year, retirementYear));
  const coversRetiringIn = (retirementYear: number) =>
    earlyYears({
      kids: kidsEarlyInput(earlyUser, hasDisabledBy(retirementYear), countedBy(retirementYear)),
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
    hasDisabled: hasDisabledBy(retirementYear),
    late: known.length - counted,
    retirementYear,
    yearsEarly: pensionYear - retirementYear,
  };
};

export const countedKids = (
  answers: YouAnswers,
): { counted: number; hasDisabled: boolean; late: number; lateYear: number } => {
  const { counted, hasDisabled, late, retirementYear } = kidsRetirement(
    answers,
    answers.kidsEarlyUser,
  );
  return { counted, hasDisabled, late, lateYear: retirementYear };
};

export type ChildNote =
  | { kind: 'noBirthYear' }
  | { kind: 'late'; turnsEight: number; retirementYear: number }
  | null;

export const childNoteOf = (answers: YouAnswers, index: number): ChildNote => {
  const typed = (answers.kidsBirthYears[index] ?? '').trim();
  if (typed === '') {
    return { kind: 'noBirthYear' };
  }
  const year = validChildBirthYear(typed, maxChildBirthYear(answers));
  const { retirementYear } = kidsRetirement(answers, answers.kidsEarlyUser);
  return year !== null && year + YEARS_RAISING_A_CHILD > retirementYear
    ? { kind: 'late', turnsEight: year + YEARS_RAISING_A_CHILD, retirementYear }
    : null;
};

const kidsRightFor = (answers: YouAnswers, earlyUser: YouAnswers['kidsEarlyUser']): number =>
  answers.kidsAdded ? kidsRetirement(answers, earlyUser).yearsEarly : 0;

export const isKidsRightAvailableToSelf = (answers: YouAnswers): boolean =>
  kidsRightFor(answers, 'me') > 0;

export const rescueRightOf = (answers: YouAnswers): number =>
  answers.workAdded && answers.hasRescue
    ? earlyYears({ rescueYears: parseInt(answers.rescueYears, 10) || 0 })
    : 0;

export const isRescueBasisAsked = (answers: YouAnswers): boolean =>
  kidsRightFor(answers, answers.kidsEarlyUser) > 0 && rescueRightOf(answers) > 0;

export const isRescueMixOffered = (answers: YouAnswers): boolean =>
  isRescueBasisAsked(answers) &&
  kidsRightFor(answers, answers.kidsEarlyUser) < rescueRightOf(answers);

export const rescueBasisOf = (answers: YouAnswers): RescueBasis | undefined => {
  if (!isRescueBasisAsked(answers)) {
    return undefined;
  }
  return answers.rescueBasis === 'mix' && !isRescueMixOffered(answers)
    ? 'pension'
    : answers.rescueBasis;
};

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
  rescue: rescueBasisOf(answers) === 'pension' ? 0 : rescueRightOf(answers),
});

export const earlyRetirementRight = (answers: YouAnswers): number =>
  Math.max(...Object.values(earlyRightSources(answers)));

export const isSpecialPensionOnly = (answers: YouAnswers): boolean =>
  isSpecialPensionOn(answers) && earlyRetirementRight(answers) === 0;

export const maxEarlyYearsOption = (answers: YouAnswers): number =>
  Math.max(FLEXIBLE_PENSION_MAX_YEARS_EARLY, earlyRetirementRight(answers));

const specialPensionStartAgeOf = (answers: YouAnswers): number | undefined => {
  const typed = answers.specialPensionStartAge.trim();
  if (!isSpecialPensionOn(answers) || typed === '') {
    return undefined;
  }
  const { min, max } = SPECIAL_PENSION_START_AGE_LIMITS;
  return Math.min(max, Math.max(min, parseInt(typed, 10) || 0));
};

// RPKS § 9 lg 5: no flexible old-age pension for someone already granted a special pension
const isFlexibleBarredBySpecialPension = (answers: YouAnswers, years: number): boolean => {
  const specialStartAge = specialPensionStartAgeOf(answers);
  return specialStartAge !== undefined && specialStartAge <= effectivePensionAge(answers) - years;
};

export const earlyYearsOptions = (answers: YouAnswers): number[] =>
  Array.from({ length: maxEarlyYearsOption(answers) + 1 }, (_, years) => years).filter(
    (years) =>
      years <= earlyRetirementRight(answers) || !isFlexibleBarredBySpecialPension(answers, years),
  );

export const isAnyFlexibleYearBarredBySpecialPension = (answers: YouAnswers): boolean =>
  earlyYearsOptions(answers).length <= maxEarlyYearsOption(answers);

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
  return earlyYearsOptions(answers).includes(years) ? years : right;
};

export const pensionAgeValue = (answers: YouAnswers): number =>
  effectivePensionAge(answers) - earlyRetirementYears(answers);

export const serviceYearsOf = (
  answers: YouAnswers,
): Required<Pick<PensionInput, 'rescueYears' | 'civilYears'>> => ({
  rescueYears: answers.workAdded && answers.hasRescue ? parseInt(answers.rescueYears, 10) || 0 : 0,
  civilYears:
    answers.workAdded && answers.isCivilServant ? parseInt(answers.civilYears, 10) || 0 : 0,
});

export const serviceIncreaseAtPension = (answers: YouAnswers): ServiceIncrease =>
  serviceIncreaseOf(
    serviceYearsOf(answers),
    birthYearOrFallback(answers) + pensionAgeValue(answers),
  );

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
    case 'civilYears':
      return answers.workAdded && answers.isCivilServant;
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

export const toStepPlanInput = (answers: YouAnswers): StepPlanInput => ({
  birthYear: birthYearOrFallback(answers),
  birthMonth: answers.birthMonth ?? undefined,
  pensionAgeYears: effectivePensionAge(answers),
  earlyRetirementYears: earlyRetirementYears(answers),
  hasSpecialPension: isSpecialPensionOn(answers),
  specialPensionStartAge: specialPensionStartAgeOf(answers),
  savesInSecondPillar:
    amountOf(answers.secondPillarAmount) > 0 || Number(answers.secondPillarRate) > 0,
  thirdPillarJoined: answers.thirdPillarJoined,
});
