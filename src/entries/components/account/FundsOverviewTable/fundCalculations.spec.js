import { getSumOfPillars } from './fundCalculations';

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
});
