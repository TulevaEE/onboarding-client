import { KidsInput } from './engine/pension';
import { isUnder3, monthsSinceBirth } from './kidsPrefill';
import {
  birthYearOrFallback,
  childRows,
  countedKids,
  effectivePensionAge,
  kidsInForecastOf,
  maxChildBirthYear,
  pensionAgeValue,
  rescueBasisOf,
  validChildBirthYear,
  YouAnswers,
} from './youAnswers';

const YEARS_RAISING_A_CHILD = 8;
const STATE_PAYS_II_PILLAR_MONTHS = 36;
const LAST_MONTH_BEFORE_II_PILLAR_PAYMENTS = 8;
const FIRST_YEAR_OF_II_PILLAR_PAYMENTS = 2021;
const LAST_YEAR_OF_1991_GROUP = 1990;
const LAST_YEAR_OF_2012_GROUP = 2012;
const YEARS_THE_BIRTH_MONTH_IS_ASKED = 3;

type Group = 'b1991' | 'b2012' | 'b2013' | 'b2021' | 'bUnknown';

interface Under3 {
  left: number | undefined;
  start?: number;
  startMonth?: number;
}

interface Child {
  group: Group;
  under3?: Under3;
  iiMonths?: number;
}

const iiMonthsOf = (typed: string): number | undefined => {
  const months = /^\d+$/.test(typed.trim()) ? Number(typed) : NaN;
  return months <= STATE_PAYS_II_PILLAR_MONTHS ? months : undefined;
};

export const isChildMonthAsked = (typedYear: string, now: Date = new Date()): boolean => {
  const year = validChildBirthYear(typedYear, Number.POSITIVE_INFINITY);
  return (
    year !== null &&
    (year === FIRST_YEAR_OF_II_PILLAR_PAYMENTS ||
      year >= now.getFullYear() - YEARS_THE_BIRTH_MONTH_IS_ASKED)
  );
};

const under3Of = (year: number, month: number, now: Date): Under3 | undefined => {
  if (!isUnder3({ year, month }, now)) {
    return undefined;
  }
  if (year > now.getFullYear()) {
    return {
      left: STATE_PAYS_II_PILLAR_MONTHS,
      start: year,
      startMonth: month || 1,
    };
  }
  const monthsLeft = STATE_PAYS_II_PILLAR_MONTHS - monthsSinceBirth({ year, month }, now);
  return { left: month ? Math.min(STATE_PAYS_II_PILLAR_MONTHS, monthsLeft) : undefined };
};

const groupOf = (year: number, month: number): Group => {
  if (year <= LAST_YEAR_OF_1991_GROUP) {
    return 'b1991';
  }
  if (year <= LAST_YEAR_OF_2012_GROUP) {
    return 'b2012';
  }
  const isBeforeIIPillarPayments =
    year < FIRST_YEAR_OF_II_PILLAR_PAYMENTS ||
    (year === FIRST_YEAR_OF_II_PILLAR_PAYMENTS && month <= LAST_MONTH_BEFORE_II_PILLAR_PAYMENTS);
  return isBeforeIIPillarPayments ? 'b2013' : 'b2021';
};

const childAt = (
  answers: YouAnswers,
  index: number,
  retirementYear: number,
  now: Date,
): Child | null => {
  const typed = (answers.kidsBirthYears[index] ?? '').trim();
  if (typed === '') {
    return { group: 'bUnknown' };
  }
  const year = validChildBirthYear(typed, maxChildBirthYear(answers));
  const month = parseInt(answers.kidsBirthMonths[index] ?? '', 10) || 0;
  if (year === null || year + YEARS_RAISING_A_CHILD > retirementYear) {
    return null;
  }
  const group = groupOf(year, month);
  if (group !== 'b2021') {
    return { group };
  }
  const under3 = under3Of(year, month, now);
  return under3
    ? { group, under3 }
    : { group, iiMonths: iiMonthsOf(answers.kidsIIMonths[index] ?? '') };
};

const oldAgePensionYearOf = (answers: YouAnswers): number => {
  const birthYear = birthYearOrFallback(answers);
  const basis = rescueBasisOf(answers);
  if (basis === 'toetus') {
    return birthYear + effectivePensionAge(answers);
  }
  const retirementYear = birthYear + pensionAgeValue(answers);
  return basis === 'mix' ? Math.max(retirementYear, countedKids(answers).lateYear) : retirementYear;
};

export const kidsInputOf = (answers: YouAnswers, now: Date = new Date()): KidsInput | undefined => {
  if (!answers.kidsAdded) {
    return undefined;
  }
  const pensionYear = oldAgePensionYearOf(answers);
  const children = Array.from({ length: childRows(answers) }, (_, index) =>
    childAt(answers, index, pensionYear, now),
  ).filter((child): child is Child => child !== null);
  const countOf = (group: Group) => children.filter((child) => child.group === group).length;
  const under3 = children.flatMap(({ under3: child }) => (child ? [child] : []));
  return {
    b1991: countOf('b1991'),
    b2012: countOf('b2012'),
    b2013: countOf('b2013'),
    b2021: countOf('b2021'),
    bUnknown: countOf('bUnknown'),
    u3: under3.length,
    u3Left: under3.map(({ left }) => left),
    u3Start: under3.map(({ start = 0 }) => start),
    u3StartMonth: under3.map(({ startMonth = 0 }) => startMonth),
    iiMonths: children
      .filter((child) => child.group === 'b2021' && !child.under3)
      .map((child) => child.iiMonths),
    monthNow: now.getMonth(),
    disabled: answers.kidsDisabled && children.length > 0,
    earlyUser: answers.kidsEarlyUser,
    user: answers.kidsEarlyUser,
    supUser: answers.kidsSupUser,
    inForecast: kidsInForecastOf(answers),
  };
};
