import { WithdrawalsEligibility } from '../../apiModels/withdrawals';

export const withdrawalsEligibilityProfiles: Record<string, WithdrawalsEligibility> = {
  UNDER_55: {
    age: 25,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: false,
    recommendedDurationYears: 60 - 25 + 20,
    arrestsOrBankruptciesPresent: false,
  },
  ONLY_THIRD_PILLAR_55: {
    age: 55,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: true,
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },

  ALL_PILLARS_60: {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: true,
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },

  ALL_PILLARS_BANKRUPTCIES_ARRESTS_60: {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: true,
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: true,
  },
} as const;

export type WithdrawalsEligibilityProfile = keyof typeof withdrawalsEligibilityProfiles;
