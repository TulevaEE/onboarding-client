import { sumBy } from 'lodash';

export function calculateTotals(input) {
  return {
    contributions: sumBy(input, 'contributionSum'),
    value: sumBy(input, 'price'),
    profit: sumBy(input, 'price') - sumBy(input, 'contributionSum'),
  };
}
