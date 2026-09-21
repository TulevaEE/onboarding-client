import { Transaction } from './apiModels';

export const signedUnits = (transaction: Transaction): number => {
  const units = transaction.units ?? 0;
  return transaction.type === 'SUBTRACTION' || transaction.type === 'TRANSFER_OUT' ? -units : units;
};
