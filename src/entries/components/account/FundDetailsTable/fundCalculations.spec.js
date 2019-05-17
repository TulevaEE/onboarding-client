import { calculateTotals } from './fundCalculations';

describe('Fund calculations', () => {
  it('groups by pillar', () => {
    const funds = [
      { isin: 'EE12', pillar: 2, contributionSum: 500, price: 1000 },
      { isin: 'EE56', pillar: 3, contributionSum: 2500, price: 3001 },
      { isin: 'EE34', pillar: 2, contributionSum: 1500, price: 2000 },
    ];

    const result = calculateTotals(funds);
    console.log(result);

    expect(result).toEqual({ contributions: 4500, profit: 1501, value: 6001 });
  });
});
