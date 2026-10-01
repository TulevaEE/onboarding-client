import omit from 'lodash/omit';
import { Transaction, TransactionType } from './apiModels';
import { signedUnits } from './transactions';
import { contribution } from '../account/TransactionSection/fixtures';

describe('signedUnits', () => {
  const transaction = (type: TransactionType, units: number): Transaction => ({
    ...contribution,
    type,
    units,
  });

  it.each<[TransactionType, number]>([
    ['CONTRIBUTION_CASH', 10],
    ['CONTRIBUTION_CASH_WORKPLACE', 10],
    ['TRANSFER_IN', 10],
  ])('leaves the units of a %s as they arrived', (type, expected) => {
    expect(signedUnits(transaction(type, 10))).toBe(expected);
  });

  it.each<[TransactionType, number]>([
    ['SUBTRACTION', -10],
    ['TRANSFER_OUT', -10],
  ])('negates the units of a %s, which leave the account', (type, expected) => {
    expect(signedUnits(transaction(type, 10))).toBe(expected);
  });

  it('counts a row that came without units as none', () => {
    expect(signedUnits(omit(contribution, 'units') as Transaction)).toBe(0);
  });
});
