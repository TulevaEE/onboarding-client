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

export const calculateTransferAmountPrices = (
  userInputs: {
    bookValue: number;
    totalPrice: number;
  },
  amounts: CapitalTransferAmountInputState[],
): CapitalTransferAmount[] =>
  amounts.map((amount) => {
    const bookValueShareOfTotal = amount.bookValue / userInputs.bookValue;

    return {
      ...amount,
      price: bookValueShareOfTotal * userInputs.totalPrice,
    };
  });

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

export const roundValuesToSecondDecimal = (amounts: CapitalTransferAmount[]) =>
  amounts.map((amount) => ({
    ...amount,
    bookValue: Number(amount.bookValue.toFixed(2)),
    price: Number(amount.price.toFixed(2)),
  }));
