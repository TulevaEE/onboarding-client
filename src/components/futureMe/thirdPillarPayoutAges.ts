export const THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 = 55;
const YEARS_BEFORE_PENSION_AGE = 5;

export const thirdPillarPayoutAge = (isJoinedBefore2021: boolean, pensionAge: number): number =>
  isJoinedBefore2021
    ? THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021
    : pensionAge - YEARS_BEFORE_PENSION_AGE;
