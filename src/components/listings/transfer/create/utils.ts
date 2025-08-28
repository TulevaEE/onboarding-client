import { CapitalRow, CapitalType } from '../../../common/apiModels/index';
import { CapitalTransferAmount } from '../../../common/apiModels/capital-transfer';

export const isLiquidatableCapitalType = (type: CapitalType) =>
  ['CAPITAL_PAYMENT', 'WORK_COMPENSATION', 'MEMBERSHIP_BONUS'].includes(type);

export const getMemberCapitalSums = (rows: CapitalRow[]) => {
  const filteredRows = rows.filter((row) => isLiquidatableCapitalType(row.type));

  return {
    unitAmount: filteredRows?.reduce((acc, row) => acc + row.unitCount, 0) ?? null,
    bookValue: filteredRows?.reduce((acc, row) => acc + row.value, 0) ?? null,
  };
};

export const getTransferCreatePath = (subPath: string) => `/capital/transfer/create/${subPath}`;

export const calculateTransferAmountsFromNewTotalBookValue = (
  userInputs: {
    bookValue: number;
  },
  userMemberCapitalRows: CapitalRow[],
): CapitalTransferAmount[] => {
  const filteredRows = userMemberCapitalRows.filter((row) => isLiquidatableCapitalType(row.type));
  const memberCapitalSums = getMemberCapitalSums(filteredRows);

  // TODO go over liquidation preference and amounts
  const liquidationCoefficient = userInputs.bookValue / memberCapitalSums.bookValue;

  return filteredRows.map((row) => ({
    type: row.type,
    bookValue: row.value * liquidationCoefficient,
    price: 0,
  }));
};

export const calculateTransferAmountPrices = (
  userInputs: {
    bookValue: number;
    totalPrice: number;
  },
  amounts: CapitalTransferAmount[],
): CapitalTransferAmount[] =>
  amounts.map((amount) => {
    const bookValueShareOfTotal = amount.bookValue / userInputs.bookValue;

    return {
      ...amount,
      price: bookValueShareOfTotal * userInputs.totalPrice,
    };
  });

export const initializeCapitalTransferAmounts = (rows: CapitalRow[]): CapitalTransferAmount[] =>
  rows
    .filter((row) => isLiquidatableCapitalType(row.type))
    .map((row) => ({
      type: row.type,
      bookValue: 0,
      price: 0,
    }));
