import { User } from '../common/apiModels';
import { CURRENT_YEAR, Sex } from './engine/pension';

const ADULT_AGE = 18;

export const BIRTH_YEAR_MIN = 1930;
export const BIRTH_YEAR_MAX = CURRENT_YEAR - ADULT_AGE;

const PERSONAL_CODE = /^\d{11}$/;
const BIRTH_YEAR_TEXT = /^\d{4}$/;
const MALE_FIRST_DIGITS = ['1', '3', '5', '7'];
const FEMALE_FIRST_DIGITS = ['2', '4', '6', '8'];
const ISO_YEAR = /^(\d{4})-/;

export interface YouPrefill {
  birthYear: number | null;
  sex: Sex | null;
}

export const parseBirthYear = (typed: string): number | null => {
  const text = typed.trim();
  const year = BIRTH_YEAR_TEXT.test(text) ? Number(text) : NaN;
  return year >= BIRTH_YEAR_MIN && year <= BIRTH_YEAR_MAX ? year : null;
};

export const deriveBirthYear = (dateOfBirth: string): number | null =>
  parseBirthYear(ISO_YEAR.exec(dateOfBirth)?.[1] ?? '');

export const deriveSex = (personalCode: string): Sex | null => {
  if (!PERSONAL_CODE.test(personalCode)) {
    return null;
  }
  if (MALE_FIRST_DIGITS.includes(personalCode[0])) {
    return 'M';
  }
  return FEMALE_FIRST_DIGITS.includes(personalCode[0]) ? 'N' : null;
};

export const derivePrefill = (user: User): YouPrefill => ({
  birthYear: deriveBirthYear(user.dateOfBirth),
  sex: deriveSex(user.personalCode),
});
