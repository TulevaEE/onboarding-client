import { CapitalRow, CapitalType } from '../../../common/apiModels/index';
import {
  CapitalTransferAmount,
  CapitalTransferAmountInputState,
} from '../../../common/apiModels/capital-transfer';

export const isLiquidatableCapitalType = (type: CapitalType) =>
  ['CAPITAL_PAYMENT', 'WORK_COMPENSATION', 'CAPITAL_ACQUIRED', 'MEMBERSHIP_BONUS'].includes(type);

export const getMemberCapitalSums = (rows: CapitalRow[]) => {
  const filteredRows = rows.filter((row) => isLiquidatableCapitalType(row.type));

  return {
    unitAmount: filteredRows?.reduce((acc, row) => acc + row.unitCount, 0) ?? null,
    bookValue: filteredRows?.reduce((acc, row) => acc + row.value, 0) ?? null,
  };
};

export const valuesEqualToSecondDecimalPoint = (a: number, b: number) => {
  const difference = Math.abs(a - b);

  return difference < 0.01;
};

export const getTransferCreatePath = (subPath: string) => `/capital/transfer/create/${subPath}`;

export const calculateTransferAmountInputsFromNewTotalBookValue = (
  bookValue: number,
  userMemberCapitalRows: CapitalRow[],
): CapitalTransferAmountInputState[] => {
  const filteredRows = sortTransferAmounts(userMemberCapitalRows).filter((row) =>
    isLiquidatableCapitalType(row.type),
  );

  const amounts: CapitalTransferAmountInputState[] = filteredRows.map((row) => ({
    type: row.type,
    bookValue: 0,
  }));

  let runningBookValue = bookValue;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < filteredRows.length; i++) {
    const row = filteredRows[i];

    if (row.value >= runningBookValue) {
      amounts[i].bookValue = runningBookValue;
    } else {
      amounts[i].bookValue = row.value;
    }

    runningBookValue -= row.value;

    if (runningBookValue <= 0) {
      return amounts;
    }
  }

  return amounts;
};

export const calculateClampedTransferAmountsAndPrices = (
  userInputs: {
    totalPrice: number;
  },
  capitalRows: CapitalRow[],
  amounts: CapitalTransferAmountInputState[],
): CapitalTransferAmount[] => {
  const amountsTotalBookValue = amounts.reduce((acc, amount) => amount.bookValue + acc, 0);

  const userTotalCapital = capitalRows.reduce(
    (acc, row) => ({
      ...acc,
      [row.type]: row.value + (acc[row.type] ?? 0),
    }),
    {} as Record<CapitalType, number>,
  );

  return amounts.map((amount) => {
    const bookValueShareOfTotal = amount.bookValue / amountsTotalBookValue;
    const price = floorValueToSecondDecimal(bookValueShareOfTotal * userInputs.totalPrice);

    if (valuesEqualToSecondDecimalPoint(userTotalCapital[amount.type], amount.bookValue)) {
      return {
        ...amount,
        price,
        bookValue: userTotalCapital[amount.type],
      };
    }

    return {
      ...amount,
      price,
      bookValue: floorValueToSecondDecimal(amount.bookValue),
    };
  });
};

export const initializeCapitalTransferAmounts = (
  rows: CapitalRow[],
): CapitalTransferAmountInputState[] =>
  rows
    .filter((row) => isLiquidatableCapitalType(row.type))
    .map((row) => ({
      type: row.type,
      bookValue: 0,
    }));

const capitalTypeOrder = [
  'CAPITAL_ACQUIRED',
  'CAPITAL_PAYMENT',
  'WORK_COMPENSATION',
  'MEMBERSHIP_BONUS',
];
export const sortTransferAmounts = <T extends { type: CapitalType }>(amounts: T[]) =>
  amounts.sort((a, b) => capitalTypeOrder.indexOf(a.type) - capitalTypeOrder.indexOf(b.type));

export const getBookValueSum = (amounts: { bookValue: number }[]) =>
  amounts.reduce((acc, amount) => acc + amount.bookValue, 0);

export const filterZeroBookValueAmounts = (amounts: CapitalTransferAmount[]) =>
  amounts.filter(({ bookValue }) => bookValue > 0);

export const floorValuesToSecondDecimal = (amounts: CapitalTransferAmount[]) =>
  amounts.map((amount) => ({
    ...amount,
    bookValue: floorValueToSecondDecimal(amount.bookValue),
    price: floorValueToSecondDecimal(amount.price),
  }));

export const floorValueToSecondDecimal = (number: number) => Math.floor(number * 100) / 100;
