import { MockModeConfiguration } from './types';

export const mockScenarios: Record<string, Partial<MockModeConfiguration>> = {
  // One saver climbing the conversion ladder, one rung at a time: II pillar to Tuleva,
  // II rate to 6%, III pillar to Tuleva, savings fund on top. Only the rung being
  // climbed changes between scenarios, so the money and the chart stay comparable and
  // the checkmarks are the only thing moving. Not tied to one page: the account status
  // box and the millionaire calculator both read this same state. Throughout, the gross
  // salary is 2000 €, where the III pillar tax ceiling is 300 € a month.
  LADDER_0_NOTHING_DONE: {
    user: 'PAYMENT_RATE_2',
    conversion: 'INCOMPLETE',
    contributions: 'SECOND_PILLAR_ONLY',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  LADDER_1_SECOND_PILLAR_AT_TULEVA: {
    user: 'PAYMENT_RATE_2',
    conversion: 'COMPLETE_ONLY_SECOND_PILLAR',
    contributions: 'SECOND_PILLAR_ONLY',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  LADDER_2_SECOND_PILLAR_RATE_MAXED: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ONLY_SECOND_PILLAR',
    contributions: 'SECOND_PILLAR_ONLY',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  LADDER_3_THIRD_PILLAR_AT_TULEVA: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_MONTHLY_MAXED',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // Saving in the fund, but as a lump sum: green, and still nudged into a standing order.
  LADDER_4_SAVING_IN_SAVINGS_FUND: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_MONTHLY_MAXED',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'COMPLETED',
    savingsFundBalance: 'WITH_BALANCE',
  },

  // Rungs where the state is subtler than done/not done, and the call to action changes.

  // A raise to 6% already requested: counts as done, the money just hasn't moved yet.
  SECOND_PILLAR_RATE_RAISE_PENDING: {
    user: 'PAYMENT_RATE_2_TO_6',
    conversion: 'COMPLETE_ONLY_SECOND_PILLAR',
    contributions: 'SECOND_PILLAR_ONLY',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // Never joined the II pillar: no open date, so they can still open one with a fund
  // choice and keep both II steps.
  NEVER_JOINED_SECOND_PILLAR: {
    user: 'THIRD_NO_SECOND_PILLAR',
    conversion: 'INCOMPLETE',
    contributions: 'NONE',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // Left the funded II pillar: both II steps are advice they cannot act on, so they see
  // the III pillar and then the savings fund instead.
  LEFT_SECOND_PILLAR: {
    user: 'LEFT_SECOND_PILLAR',
    conversion: 'COMPLETE_ONLY_THIRD_PILLAR',
    contributions: 'THIRD_PILLAR_MONTHLY_MAXED',
    sourceFunds: 'ONLY_THIRD_PILLAR',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // III pillar at Tuleva, but no money into it this year: not done, still asked to pay.
  THIRD_PILLAR_NO_PAYMENT_THIS_YEAR: {
    user: 'PAYMENT_RATE_6',
    conversion: 'THIRD_PILLAR_NO_PAYMENT_THIS_YEAR',
    contributions: 'SECOND_PILLAR_ONLY',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // Paying into the III pillar, but as a lump sum: done, yet still worth a standing order.
  THIRD_PILLAR_ONE_OFF: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_ONE_OFF',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // A standing order paying less than the tax ceiling, so there is room to raise it.
  THIRD_PILLAR_MONTHLY_BELOW_TAX_CAP: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_MONTHLY_BELOW_CAP',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
  // Joined the savings fund but never paid in: asked for a first deposit, not a habit.
  SAVINGS_FUND_JOINED_BUT_EMPTY: {
    user: 'PAYMENT_RATE_6',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_MONTHLY_MAXED',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'COMPLETED',
    savingsFundBalance: 'ZERO_BALANCE',
  },
  // Past retirement age: no projection to show, so the chart gives way to a notice. No
  // savings fund either, so the inputs stay the plain pension ones.
  PAST_RETIREMENT_AGE: {
    user: 'PAST_RETIREMENT_AGE',
    conversion: 'COMPLETE_ALL_PILLARS',
    contributions: 'THIRD_PILLAR_MONTHLY_MAXED',
    sourceFunds: 'BOTH_PILLARS',
    savingsFundOnboardingStatus: 'NOT_STARTED',
    savingsFundBalance: 'NO_ACCOUNT',
  },
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
