export const NEAR_MARKET_TOLERANCE_BPS = 150;

const BPS_IN_ONE = 10000;

const bpsAbove = (rate: number, benchmark: number) => Math.round((rate - benchmark) * BPS_IN_ONE);

export const isBehindMarket = (rate: number, benchmark: number) =>
  bpsAbove(rate, benchmark) < -NEAR_MARKET_TOLERANCE_BPS;

export const isAheadOfMarket = (rate: number, benchmark: number) =>
  bpsAbove(rate, benchmark) > NEAR_MARKET_TOLERANCE_BPS;
