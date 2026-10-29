import { Contribution, PendingOnboarding, Role, User } from '../common/apiModels';
import { isChildRole } from '../common/utils';
import { dayInTallinn } from '../common/dateFormatter';

const PERSONAL_CODE = /^[1-8]\d{10}$/;
const MONTHS_IN_YEAR = 12;
const FIRST_BIRTH_YEAR_WITH_PARENTAL_PAYMENT = 2021;
const FIRST_BIRTH_MONTH_WITH_PARENTAL_PAYMENT = 9;
const YEARS_UNDER_3_WITHOUT_BIRTH_MONTH = 2;
const YEARS_OF_PARENTAL_PAYMENT = 3;
export const PARENTAL_PAYMENT_MONTHS = 36;
const CENTURY_BY_FIRST_DIGIT = [1800, 1800, 1900, 1900, 2000, 2000, 2100, 2100];

export interface TulevaChild {
  personalCode: string;
}

export interface KidsPrefill {
  birthYears: number[];
  birthMonths: number[];
  iiMonths: string[];
}

export type ChildBirth = { year: number; month: number };

const isBornWithParentalPayment = ({ year, month }: ChildBirth): boolean =>
  year > FIRST_BIRTH_YEAR_WITH_PARENTAL_PAYMENT ||
  (year === FIRST_BIRTH_YEAR_WITH_PARENTAL_PAYMENT &&
    month >= FIRST_BIRTH_MONTH_WITH_PARENTAL_PAYMENT);

const birthMonthOf = (birth: ChildBirth): number => birth.year * MONTHS_IN_YEAR + birth.month - 1;

export const monthsSinceBirth = (birth: ChildBirth, now: Date): number =>
  now.getFullYear() * MONTHS_IN_YEAR + now.getMonth() - birthMonthOf(birth);

export const isUnder3 = (birth: ChildBirth, now: Date): boolean => {
  if (birth.year > now.getFullYear()) {
    return true;
  }
  if (birth.month) {
    return monthsSinceBirth(birth, now) < PARENTAL_PAYMENT_MONTHS;
  }
  return birth.year >= now.getFullYear() - YEARS_UNDER_3_WITHOUT_BIRTH_MONTH;
};

export const isParentalPaymentMonthsAsked = (birth: ChildBirth, now: Date): boolean =>
  isBornWithParentalPayment(birth) && !isUnder3(birth, now);

export const childBirthOf = (personalCode: string): ChildBirth | null => {
  if (!PERSONAL_CODE.test(personalCode)) {
    return null;
  }
  const month = Number(personalCode.slice(3, 5));
  if (month < 1 || month > MONTHS_IN_YEAR) {
    return null;
  }
  const century = CENTURY_BY_FIRST_DIGIT[Number(personalCode[0]) - 1];
  return { year: century + Number(personalCode.slice(1, 3)), month };
};

const monthIndexOf = (isoTime: string): number => {
  const day = dayInTallinn(isoTime);
  return Number(day.slice(0, 4)) * MONTHS_IN_YEAR + Number(day.slice(5, 7)) - 1;
};

const monthsPaidFor = (birth: ChildBirth, contributions: Contribution[]): number => {
  const firstMonth = birthMonthOf(birth);
  const lastMonth = firstMonth + PARENTAL_PAYMENT_MONTHS;
  const paidMonths = new Set(
    contributions
      .filter(
        (contribution) => contribution.pillar === 2 && contribution.additionalParentalBenefit > 0,
      )
      .map(({ time }) => monthIndexOf(time))
      .filter((month) => month >= firstMonth && month <= lastMonth),
  );
  return Math.min(paidMonths.size, PARENTAL_PAYMENT_MONTHS);
};

// A payment names no child, so with siblings born within its 36 months it cannot be told whose it is.
const sharesPaymentYears = (birth: ChildBirth, births: ChildBirth[]): boolean =>
  births.some(
    (other) =>
      other !== birth &&
      Math.abs(birthMonthOf(other) - birthMonthOf(birth)) <= PARENTAL_PAYMENT_MONTHS,
  );

const isPaymentPeriodOver = (birth: ChildBirth, today: Date): boolean =>
  monthIndexOf(today.toISOString()) > birthMonthOf(birth) + PARENTAL_PAYMENT_MONTHS;

const iiMonthsOf = (
  birth: ChildBirth,
  births: ChildBirth[],
  contributions: Contribution[],
  today: Date,
): string => {
  const months =
    isParentalPaymentMonthsAsked(birth, today) &&
    isPaymentPeriodOver(birth, today) &&
    !sharesPaymentYears(birth, births)
      ? monthsPaidFor(birth, contributions)
      : 0;
  return months > 0 ? String(months) : '';
};

export const isPrefilledChild = (
  prefill: KidsPrefill,
  birthYears: string[],
  index: number,
): boolean =>
  index < prefill.birthYears.length && birthYears[index] === String(prefill.birthYears[index]);

const sharesPaymentYearsWithAddedChild = (
  prefill: KidsPrefill,
  birthYears: string[],
  index: number,
): boolean =>
  birthYears.some(
    (typed, other) =>
      other !== index &&
      !isPrefilledChild(prefill, birthYears, other) &&
      Math.abs(Number(typed) - prefill.birthYears[index]) <= YEARS_OF_PARENTAL_PAYMENT,
  );

export const attributableIIMonths = (
  prefill: KidsPrefill | null,
  birthYears: string[],
  iiMonths: string[],
): string[] =>
  iiMonths.map((months, index) =>
    prefill !== null &&
    isPrefilledChild(prefill, birthYears, index) &&
    months === prefill.iiMonths[index] &&
    sharesPaymentYearsWithAddedChild(prefill, birthYears, index)
      ? ''
      : months,
  );

export const tulevaChildrenOf = (
  user: User,
  roles: Role[] = [],
  pendingOnboardings: PendingOnboarding[] = [],
): TulevaChild[] => {
  const codes = [...roles, ...pendingOnboardings]
    .filter((role) => isChildRole(role, user))
    .map(({ code }) => code);
  return Array.from(new Set(codes)).map((code) => ({ personalCode: code }));
};

export const deriveKidsPrefill = (
  children: TulevaChild[] | undefined,
  contributions: Contribution[] | undefined,
  today: Date = new Date(),
): KidsPrefill | null => {
  const births = (children ?? [])
    .map(({ personalCode }) => childBirthOf(personalCode))
    .filter((birth): birth is ChildBirth => birth !== null);
  return births.length === 0
    ? null
    : {
        birthYears: births.map(({ year }) => year),
        birthMonths: births.map(({ month }) => month),
        iiMonths: births.map((birth) => iiMonthsOf(birth, births, contributions ?? [], today)),
      };
};
