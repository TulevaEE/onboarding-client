export const THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 = 55;
export const THIRD_PILLAR_PAYOUT_AGE = 60;

export const thirdPillarPayoutAge = (isJoinedBefore2021: boolean): number =>
  isJoinedBefore2021 ? THIRD_PILLAR_PAYOUT_AGE_JOINED_BEFORE_2021 : THIRD_PILLAR_PAYOUT_AGE;
