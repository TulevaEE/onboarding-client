import { Contribution, SecondPillarContribution, SourceFund, User } from '../common/apiModels';
import { FundPensionStatus } from '../common/apiModels/withdrawals';
import { deriveGrossSalary } from '../common/grossSalary';
import { CURRENT_YEAR, Sex } from './engine/pension';
import { deriveKidsPrefill } from './kidsPrefill';
import {
  contributesMonthlyToThirdPillar,
  latestThirdPillarMonthlyAmount,
} from '../millionaire/prefill';
import type { KidsPrefill, TulevaChild } from './kidsPrefill';
import type { ThirdPillarJoined } from './youAnswers';

const ADULT_AGE = 18;

export const BIRTH_YEAR_MIN = 1930;
export const BIRTH_YEAR_MAX = CURRENT_YEAR - ADULT_AGE;

const PERSONAL_CODE = /^\d{11}$/;
const BIRTH_YEAR_TEXT = /^\d{4}$/;
const MALE_FIRST_DIGITS = ['1', '3', '5', '7'];
const FEMALE_FIRST_DIGITS = ['2', '4', '6', '8'];
const ISO_YEAR = /^(\d{4})-/;
const ISO_MONTH = /^\d{4}-(\d{2})-/;

const DEFAULT_SECOND_PILLAR_RATE_PERCENT = 2;
const NO_SECOND_PILLAR_RATE = '0';
const THIRD_PILLAR_RULES_CHANGE_YEAR = 2021;
const SALARY_PAYMENT_MAX_MONTHS_AGO = 3;
const THIRD_PILLAR_AVERAGE_MONTHS = 12;
const MONTHS_IN_YEAR = 12;

export interface YouPrefill {
  birthYear: number | null;
  sex: Sex | null;
  birthMonth?: number | null;
  registerPensionAge?: number | null;
  secondPillarRate: string | null;
  grossMonthly?: string | null;
  secondPillarAmount?: string | null;
  thirdPillarAmount?: string | null;
  thirdPillarMonthly?: string | null;
  thirdPillarJoined?: ThirdPillarJoined | null;
  kids?: KidsPrefill | null;
  fundPensions?: FundPensionChoice[];
}

export interface FundPensionChoice {
  pillar: 'SECOND' | 'THIRD';
  startYear: number;
  startAge: number;
}

export interface PensionData {
  contributions?: Contribution[];
  sourceFunds?: SourceFund[];
  children?: TulevaChild[];
  fundPensionStatus?: FundPensionStatus;
}

export const parseBirthYear = (typed: string): number | null => {
  const text = typed.trim();
  const year = BIRTH_YEAR_TEXT.test(text) ? Number(text) : NaN;
  return year >= BIRTH_YEAR_MIN && year <= BIRTH_YEAR_MAX ? year : null;
};

export const deriveBirthYear = (dateOfBirth: string): number | null =>
  parseBirthYear(ISO_YEAR.exec(dateOfBirth)?.[1] ?? '');

export const deriveBirthMonth = (dateOfBirth: string): number | null => {
  const month = Number(ISO_MONTH.exec(dateOfBirth)?.[1]);
  return month >= 1 && month <= 12 ? month : null;
};

export const deriveSex = (personalCode: string): Sex | null => {
  if (!PERSONAL_CODE.test(personalCode)) {
    return null;
  }
  if (MALE_FIRST_DIGITS.includes(personalCode[0])) {
    return 'M';
  }
  return FEMALE_FIRST_DIGITS.includes(personalCode[0]) ? 'N' : null;
};

export const deriveSecondPillarRate = (user: User): string =>
  user.secondPillarActive
    ? String((user.secondPillarPaymentRates?.current ?? DEFAULT_SECOND_PILLAR_RATE_PERCENT) / 100)
    : NO_SECOND_PILLAR_RATE;

export const deriveThirdPillarJoined = (user: User): ThirdPillarJoined => {
  const joinedYear = ISO_YEAR.exec(user.thirdPillarInitDate ?? '')?.[1];
  if (joinedYear === undefined) {
    return 'none';
  }
  return Number(joinedYear) < THIRD_PILLAR_RULES_CHANGE_YEAR ? 'before' : 'after';
};

const monthIndex = (isoTime: string): number =>
  Number(isoTime.slice(0, 4)) * MONTHS_IN_YEAR + Number(isoTime.slice(5, 7)) - 1;

const monthsAgo = (isoTime: string, today: Date): number =>
  monthIndex(today.toISOString()) - monthIndex(isoTime);

const roundedEuros = (amount: number): string | null =>
  amount > 0 ? String(Math.round(amount)) : null;

const isSocialTaxPayment = (contribution: Contribution): contribution is SecondPillarContribution =>
  contribution.pillar === 2 && contribution.socialTaxPortion > 0;

export const deriveGrossMonthly = (
  contributions: Contribution[],
  today: Date = new Date(),
): string | null => {
  const payments = contributions.filter(isSocialTaxPayment);
  const latestMonth = Math.max(...payments.map(({ time }) => monthIndex(time)));
  const latestMonthAgo = monthIndex(today.toISOString()) - latestMonth;
  if (latestMonthAgo > SALARY_PAYMENT_MAX_MONTHS_AGO) {
    return null;
  }
  const gross = deriveGrossSalary(payments, today);
  return gross === null ? null : String(gross);
};

export const deriveThirdPillarMonthly = (
  contributions: Contribution[],
  today: Date = new Date(),
): string | null => {
  if (contributesMonthlyToThirdPillar(contributions, today)) {
    return roundedEuros(latestThirdPillarMonthlyAmount(contributions, today));
  }
  const paidInAYear = contributions
    .filter(
      ({ pillar, time }) => pillar === 3 && monthsAgo(time, today) < THIRD_PILLAR_AVERAGE_MONTHS,
    )
    .reduce((sum, { amount }) => sum + amount, 0);
  return roundedEuros(paidInAYear / THIRD_PILLAR_AVERAGE_MONTHS);
};

export const derivePillarAmount = (sourceFunds: SourceFund[], pillar: 2 | 3): string | null =>
  roundedEuros(
    sourceFunds
      .filter((fund) => fund.pillar === pillar)
      .reduce((sum, { price, unavailablePrice }) => sum + price + unavailablePrice, 0),
  );

export const deriveFundPensionChoices = (
  status: FundPensionStatus,
  birthYear: number | null,
): FundPensionChoice[] =>
  status.fundPensions.flatMap(({ pillar, startDate }) => {
    const startYear = parseInt(startDate.slice(0, 4), 10);
    return birthYear === null || Number.isNaN(startYear)
      ? []
      : [{ pillar, startYear, startAge: startYear - birthYear }];
  });

export const derivePrefill = (
  user: User,
  { contributions = [], sourceFunds = [], children, fundPensionStatus }: PensionData = {},
  today: Date = new Date(),
): YouPrefill => {
  const thirdPillarAmount = derivePillarAmount(sourceFunds, 3);
  const thirdPillarJoined = deriveThirdPillarJoined(user);
  const hasThirdPillarMoneyWithoutJoinDate = thirdPillarJoined === 'none' && thirdPillarAmount;
  const birthYear = deriveBirthYear(user.dateOfBirth);
  return {
    birthYear,
    sex: deriveSex(user.personalCode),
    birthMonth: deriveBirthMonth(user.dateOfBirth),
    registerPensionAge: user.retirementAge ?? null,
    secondPillarRate: deriveSecondPillarRate(user),
    grossMonthly: deriveGrossMonthly(contributions, today),
    secondPillarAmount: derivePillarAmount(sourceFunds, 2),
    thirdPillarAmount,
    thirdPillarMonthly: deriveThirdPillarMonthly(contributions, today),
    thirdPillarJoined: hasThirdPillarMoneyWithoutJoinDate ? null : thirdPillarJoined,
    kids: deriveKidsPrefill(children, contributions, today),
    fundPensions: fundPensionStatus ? deriveFundPensionChoices(fundPensionStatus, birthYear) : [],
  };
};
