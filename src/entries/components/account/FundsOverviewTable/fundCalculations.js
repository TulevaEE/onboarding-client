import { chain } from 'lodash';

export function calculateTotals(input) {
  return {
    contributions: input.reduce(function(prev, cur) {
      return prev + cur.contributions;
    }, 0),

    value: input.reduce(function(prev, cur) {
      return prev + cur.value;
    }, 0),

    profit: input.reduce(function(prev, cur) {
      return prev + (cur.value - cur.contributions);
    }, 0),
  };
}

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
