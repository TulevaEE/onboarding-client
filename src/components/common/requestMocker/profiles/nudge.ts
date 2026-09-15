import { NudgeDecision } from '../../apiModels/nudge';

export const nudgeProfiles: Record<string, NudgeDecision> = {
  NONE: { key: 'NONE', tag: 'nudge_none' },
  SECOND_PILLAR_TRANSFER: {
    key: 'SECOND_PILLAR_TRANSFER',
    tag: 'nudge_second_pillar',
    feeComparison: {
      currentFeePercent: 0.65,
      currentFeeAmount: 130,
      tulevaFeeAmount: 56,
      savingsAmount: 74,
    },
  },
  SECOND_PILLAR_TRANSFER_WITHOUT_FEE_COMPARISON: {
    key: 'SECOND_PILLAR_TRANSFER',
    tag: 'nudge_second_pillar',
  },
  SECOND_PILLAR_PAYMENT_RATE: { key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' },
  THIRD_PILLAR_START: { key: 'THIRD_PILLAR_START', tag: 'nudge_third_pillar' },
  THIRD_PILLAR_FEES: { key: 'THIRD_PILLAR_FEES', tag: 'nudge_third_pillar' },
  THIRD_PILLAR_RECURRING: { key: 'THIRD_PILLAR_RECURRING', tag: 'nudge_third_pillar_recurring' },
  THIRD_PILLAR_RAISE: { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' },
  SAVINGS_FUND: { key: 'SAVINGS_FUND', tag: 'nudge_savings_fund', savingsFundFeePercent: 0.28 },
  SAVINGS_FUND_RECURRING: { key: 'SAVINGS_FUND_RECURRING', tag: 'nudge_savings_fund_recurring' },
  MEMBERSHIP: { key: 'MEMBERSHIP', tag: 'nudge_membership' },
};
