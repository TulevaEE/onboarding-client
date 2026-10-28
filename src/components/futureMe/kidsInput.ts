import { KidsInput } from './engine/pension';
import {
  childRows,
  countedKids,
  maxChildBirthYear,
  validChildBirthYear,
  YouAnswers,
} from './youAnswers';

const YEARS_RAISING_A_CHILD = 8;
const STATE_PAYS_II_PILLAR_MONTHS = 36;
const LAST_MONTH_BEFORE_II_PILLAR_PAYMENTS = 8;
const FIRST_YEAR_OF_II_PILLAR_PAYMENTS = 2021;
const LAST_YEAR_OF_1991_GROUP = 1990;
const LAST_YEAR_OF_2012_GROUP = 2012;
const MONTHS_IN_YEAR = 12;
const YEARS_THE_BIRTH_MONTH_IS_ASKED = 3;
const YEARS_UNDER_3_WITHOUT_BIRTH_MONTH = 2;

type Group = 'b1991' | 'b2012' | 'b2013' | 'b2021' | 'bUnknown';

interface Under3 {
  left: number | undefined;
  start?: number;
  startMonth?: number;
}

interface Child {
  group: Group;
  under3?: Under3;
}

export const isChildMonthAsked = (typedYear: string, now: Date = new Date()): boolean => {
  const year = validChildBirthYear(typedYear, Number.POSITIVE_INFINITY);
  return (
    year !== null &&
    (year === FIRST_YEAR_OF_II_PILLAR_PAYMENTS ||
      year >= now.getFullYear() - YEARS_THE_BIRTH_MONTH_IS_ASKED)
  );
};

const monthsSince = (year: number, month: number, now: Date): number =>
  now.getFullYear() * MONTHS_IN_YEAR + now.getMonth() - (year * MONTHS_IN_YEAR + month - 1);

const under3Of = (year: number, month: number, now: Date): Under3 | undefined => {
  const monthsLeft = STATE_PAYS_II_PILLAR_MONTHS - monthsSince(year, month, now);
  if (year > now.getFullYear()) {
    return {
      left: STATE_PAYS_II_PILLAR_MONTHS,
      start: year,
      startMonth: month || 1,
    };
  }
  if (month) {
    return monthsLeft > 0 ? { left: Math.min(STATE_PAYS_II_PILLAR_MONTHS, monthsLeft) } : undefined;
  }
  return year >= now.getFullYear() - YEARS_UNDER_3_WITHOUT_BIRTH_MONTH
    ? { left: undefined }
    : undefined;
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
  const year = validChildBirthYear(answers.kidsBirthYears[index] ?? '', maxChildBirthYear(answers));
  const month = parseInt(answers.kidsBirthMonths[index] ?? '', 10) || 0;
  if (year === null) {
    return { group: 'bUnknown' };
  }
  if (year + YEARS_RAISING_A_CHILD > retirementYear) {
    return null;
  }
  const group = groupOf(year, month);
  return group === 'b2021' ? { group, under3: under3Of(year, month, now) } : { group };
};

export const kidsInputOf = (answers: YouAnswers, now: Date = new Date()): KidsInput | undefined => {
  if (!answers.kidsAdded) {
    return undefined;
  }
  const { lateYear } = countedKids(answers);
  const children = Array.from({ length: childRows(answers) }, (_, index) =>
    childAt(answers, index, lateYear, now),
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
    monthNow: now.getMonth(),
    disabled: answers.kidsDisabled && children.length > 0,
    earlyUser: answers.kidsEarlyUser,
    user: answers.kidsEarlyUser,
    supUser: answers.kidsSupUser,
    inForecast: answers.kidsInForecast,
  };
};
