const CENTURY_BY_LEADING_DIGIT: Record<string, number> = {
  '1': 1800,
  '2': 1800,
  '3': 1900,
  '4': 1900,
  '5': 2000,
  '6': 2000,
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

const isRealBirthDate = (code: string, century: number): boolean => {
  const year = century + Number(code.slice(1, 3));
  const month = Number(code.slice(3, 5));
  const day = Number(code.slice(5, 7));
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const isValidPersonalCode = (code: string): boolean => {
  if (!/^\d{11}$/.test(code)) {
    return false;
  }
  const century = CENTURY_BY_LEADING_DIGIT[code[0]];
  if (!century || !isRealBirthDate(code, century)) {
    return false;
  }
  const digits = code.split('').map(Number);
  return controlDigit(digits) === digits[10];
};
