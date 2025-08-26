import { CapitalRow, CapitalType } from '../../../common/apiModels';
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

export const calculateTransferAmounts = (
  userInputs: {
    totalPrice: number;
    unitCount: number;
  },
  userMemberCapitalRows: CapitalRow[],
): CapitalTransferAmount[] => {
  const filteredRows = userMemberCapitalRows.filter((row) => isLiquidatableCapitalType(row.type));
  const memberCapitalSums = getMemberCapitalSums(filteredRows);

  // TODO go over liquidation preference and amounts
  const liquidationCoefficient = userInputs.totalPrice / memberCapitalSums.bookValue;

  return filteredRows.map((row) => ({
    type: row.type,
    units: row.unitCount * liquidationCoefficient,
    price: row.value * liquidationCoefficient,
  }));
};
