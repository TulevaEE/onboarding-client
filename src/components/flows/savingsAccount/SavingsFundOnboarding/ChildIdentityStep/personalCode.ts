// Validates an Estonian personal identification code (isikukood): 11 digits, a
// plausible century/birth date, and a valid mod-11 control digit. Catches typos
// on the client so a clearly-wrong code never reaches the backend as a 400.
const CENTURY_BY_LEADING_DIGIT: Record<string, number> = {
  '1': 1800,
  '2': 1800,
  '3': 1900,
  '4': 1900,
  '5': 2000,
  '6': 2000,
  '7': 2100,
  '8': 2100,
};

const FIRST_WEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
const SECOND_WEIGHTS = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

const controlDigit = (digits: number[]): number => {
  const weightedRemainder = (weights: number[]) =>
    weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11;

  const remainder = weightedRemainder(FIRST_WEIGHTS);
  if (remainder < 10) {
    return remainder;
  }
  const secondRemainder = weightedRemainder(SECOND_WEIGHTS);
  return secondRemainder < 10 ? secondRemainder : 0;
};

export const isValidEstonianPersonalCode = (value: string): boolean => {
  if (!/^\d{11}$/.test(value)) {
    return false;
  }

  const century = CENTURY_BY_LEADING_DIGIT[value[0]];
  if (!century) {
    return false;
  }

  const year = century + Number(value.slice(1, 3));
  const month = Number(value.slice(3, 5));
  const day = Number(value.slice(5, 7));
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) {
    return false;
  }

  const digits = value.split('').map(Number);
  return controlDigit(digits) === digits[10];
};
