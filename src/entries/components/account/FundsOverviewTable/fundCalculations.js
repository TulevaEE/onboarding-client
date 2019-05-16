import { chain } from 'lodash';

export function getSumOfPillars(input) {
  return chain(input)
    .groupBy('pillar')
    .map(function(v, i) {
      return {
        pillar: i,
        contributions: v.reduce(function(prev, cur) {
          return prev + cur.contributionSum;
        }, 0),
        value: v.reduce(function(prev, cur) {
          return prev + cur.price;
        }, 0),
      };
    })
    .value();
}
