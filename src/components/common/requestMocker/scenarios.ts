import { MockModeConfiguration } from './types';

export const mockScenarios: Record<string, Partial<MockModeConfiguration>> = {
  WITHDRAWALS_PENSIONER_60_ALL_PILLARS: {
    withdrawalsEligibility: 'ALL_PILLARS_60',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_THIRD_PILLAR_UNDER_5_YEARS_61: {
    withdrawalsEligibility: 'THIRD_PILLAR_UNDER_5_YEARS_61',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_UNDER_60_JOINED_AFTER_2021: {
    withdrawalsEligibility: 'UNDER_55',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_UNDER_55_JOINED_BEFORE_2021: {
    withdrawalsEligibility: 'UNDER_55_JOINED_BEFORE_2021',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_ONLY_THIRD_PILLAR_JOINED_BEFORE_2021: {
    withdrawalsEligibility: 'UNDER_55_JOINED_BEFORE_2021',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
  },
  WITHDRAWALS_AT_55_JOINED_BEFORE_2021: {
    withdrawalsEligibility: 'ONLY_THIRD_PILLAR_55',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_ONLY_SECOND_PILLAR_UNDER_60: {
    withdrawalsEligibility: 'UNDER_60_NO_THIRD_PILLAR',
    sourceFunds: 'ONLY_SECOND_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_SECOND_PILLAR',
  },
  WITHDRAWALS_ONLY_THIRD_PILLAR_AT_55_JOINED_BEFORE_2021: {
    withdrawalsEligibility: 'ONLY_THIRD_PILLAR_55',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
  },
  WITHDRAWALS_ONLY_THIRD_PILLAR_UNDER_5_YEARS_61: {
    withdrawalsEligibility: 'THIRD_PILLAR_UNDER_5_YEARS_61',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
  },
  WITHDRAWALS_ONLY_THIRD_PILLAR_LEFT_SECOND_60: {
    withdrawalsEligibility: 'ALL_PILLARS_60',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
  },
  WITHDRAWALS_ONLY_THIRD_PILLAR_UNDER_60: {
    withdrawalsEligibility: 'UNDER_55',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
  },
  WITHDRAWALS_ARRESTS_OR_BANKRUPTCIES_60: {
    withdrawalsEligibility: 'ALL_PILLARS_BANKRUPTCIES_ARRESTS_60',
    sourceFunds: 'BOTH_PILLARS',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ALL_PILLARS',
  },
  WITHDRAWALS_NO_THIRD_PILLAR_65: {
    withdrawalsEligibility: 'NO_THIRD_PILLAR_65',
    sourceFunds: 'ONLY_SECOND_PILLAR',
    fundPensionStatus: 'NO_FUND_PENSION',
    conversion: 'COMPLETE_ONLY_SECOND_PILLAR',
  },
};
