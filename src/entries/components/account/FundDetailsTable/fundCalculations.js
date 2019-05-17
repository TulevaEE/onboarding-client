export function calculateTotals(input) {
  return {
    contributions: input.reduce(function(prev, cur) {
      return prev + cur.contributionSum;
    }, 0),

    value: input.reduce(function(prev, cur) {
      return prev + cur.price;
    }, 0),

    profit: input.reduce(function(prev, cur) {
      return prev + (cur.price - cur.contributionSum);
    }, 0),
  };
}
