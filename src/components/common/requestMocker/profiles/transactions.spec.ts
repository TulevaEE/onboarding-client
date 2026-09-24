import { transactionsProfiles } from './transactions';

const allTransactions = Object.values(transactionsProfiles).flat();
const redemptions = allTransactions.filter((transaction) => transaction.type === 'SUBTRACTION');

describe('transactions mock profiles', () => {
  it('include redemptions', () => {
    expect(redemptions.length).toBeGreaterThan(0);
  });

  it.each(redemptions.map((transaction) => [transaction.id, transaction]))(
    'redemption %s has a negative amount and positive units, as the API sends them',
    (_id, transaction) => {
      expect(transaction.amount).toBeLessThan(0);
      expect(transaction.units).toBeGreaterThan(0);
    },
  );
});
