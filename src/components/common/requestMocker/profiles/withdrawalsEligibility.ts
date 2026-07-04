import { WithdrawalsEligibility } from '../../apiModels/withdrawals';

export const withdrawalsEligibilityProfiles: Record<string, WithdrawalsEligibility> = {
  UNDER_55: {
    age: 25,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: false,
    canWithdrawThirdPillarWithReducedTaxFrom: '2061-06-01',
    earlyRetirementDate: '2061-06-01',
    recommendedDurationYears: 60 - 25 + 20,
    arrestsOrBankruptciesPresent: false,
  },
  UNDER_55_JOINED_BEFORE_2021: {
    age: 34,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: false,
    canWithdrawThirdPillarWithReducedTaxFrom: '2047-01-15',
    earlyRetirementDate: '2052-01-15',
    recommendedDurationYears: 60 - 34 + 20,
    arrestsOrBankruptciesPresent: false,
  },
  UNDER_60_NO_THIRD_PILLAR: {
    age: 45,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: false,
    canWithdrawThirdPillarWithReducedTaxFrom: null,
    earlyRetirementDate: '2041-06-01',
    recommendedDurationYears: 60 - 45 + 20,
    arrestsOrBankruptciesPresent: false,
  },
  ONLY_THIRD_PILLAR_55: {
    age: 55,
    hasReachedEarlyRetirementAge: false,
    canWithdrawThirdPillarWithReducedTax: true,
    canWithdrawThirdPillarWithReducedTaxFrom: '2025-01-01',
    earlyRetirementDate: '2031-01-01',
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },

  THIRD_PILLAR_UNDER_5_YEARS_61: {
    age: 61,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: false,
    canWithdrawThirdPillarWithReducedTaxFrom: '2028-06-01',
    earlyRetirementDate: '2025-06-01',
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },

  NO_THIRD_PILLAR_65: {
    age: 65,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: false,
    canWithdrawThirdPillarWithReducedTaxFrom: null,
    earlyRetirementDate: '2021-01-01',
    recommendedDurationYears: 15,
    arrestsOrBankruptciesPresent: false,
  },

  ALL_PILLARS_60: {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: true,
    canWithdrawThirdPillarWithReducedTaxFrom: '2024-10-01',
    earlyRetirementDate: '2024-10-02',
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: false,
  },

  ALL_PILLARS_BANKRUPTCIES_ARRESTS_60: {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    canWithdrawThirdPillarWithReducedTax: true,
    canWithdrawThirdPillarWithReducedTaxFrom: '2024-10-01',
    earlyRetirementDate: '2024-10-02',
    recommendedDurationYears: 20,
    arrestsOrBankruptciesPresent: true,
  },
} as const;
