import { allSecondPillarFunds } from '../common/requestMocker/profiles/secondPillarFunds';
import { FUND_DETAILS } from './fundDetails';

test('describes every II pillar fund of the published comparison', () => {
  const undescribed = allSecondPillarFunds
    .map((fund) => fund.isin)
    .filter((isin) => !FUND_DETAILS[isin]);

  expect(undescribed).toEqual([]);
});
