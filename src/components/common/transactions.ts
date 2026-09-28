import { Transaction } from './apiModels';

export const isAcquisition = (transaction: Transaction): boolean =>
  transaction.type !== 'SUBTRACTION' && transaction.type !== 'TRANSFER_OUT';

export const signedUnits = (transaction: Transaction): number => {
  const units = transaction.units ?? 0;
  return isAcquisition(transaction) ? units : -units;
};
