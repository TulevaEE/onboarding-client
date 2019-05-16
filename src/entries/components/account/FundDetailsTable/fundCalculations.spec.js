import { getSumOfPillars, calculateTotals } from './fundCalculations';

describe('Fund calculations', () => {
  it('groups by pillar', () => {
    const funds = [
      { isin: 'EE12', pillar: 2, contributionSum: 500, price: 1000 },
      { isin: 'EE56', pillar: 3, contributionSum: 2500, price: 3001 },
      { isin: 'EE34', pillar: 2, contributionSum: 1500, price: 2000 },
    ];

    const result = getSumOfPillars(funds);
    console.log(result);

    expect(result).toEqual([
      { pillar: '2', contributions: 2000, value: 3000 },
      { pillar: '3', contributions: 2500, value: 3001 },
    ]);
  });

  it('sum of contribution', () => {
    const funds = [
      { pillar: '2', contributions: 111.11, value: 222.08 },
      { pillar: '3', contributions: 111.11, value: 111.01 },
    ];

    const result = calculateTotals(funds);
    console.log(result);

    expect(result).toEqual({
      contributions: 222.22,
      value: 333.09000000000003,
      profit: 110.87000000000002,
    });
  });
});
