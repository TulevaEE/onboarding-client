export type NudgeContext =
  | 'ACCOUNT'
  | 'SECOND_PILLAR_MANDATE'
  | 'SECOND_PILLAR_PAYMENT_RATE'
  | 'THIRD_PILLAR_MANDATE'
  | 'THIRD_PILLAR_PAYMENT'
  | 'THIRD_PILLAR_RECURRING_CONFIRMATION'
  | 'SAVINGS_FUND_PAYMENT'
  | 'MEMBERSHIP';

export interface NudgeFeeComparison {
  currentFeePercent: number;
  currentFeeAmount: number;
  tulevaFeeAmount: number;
  savingsAmount: number;
}

export interface PaymentRateSeason {
  deadline: string;
  fulfillmentDate: string;
  mode: 'SEASON' | 'LAST_DAYS';
}

export type NudgeDecision = { paymentRateSeason?: PaymentRateSeason } & (
  | { key: 'SECOND_PILLAR_TRANSFER'; tag: string; feeComparison?: NudgeFeeComparison }
  | { key: 'SECOND_PILLAR_PAYMENT_RATE'; tag: string }
  | { key: 'THIRD_PILLAR_START'; tag: string }
  | { key: 'THIRD_PILLAR_FEES'; tag: string }
  | { key: 'THIRD_PILLAR_RECURRING'; tag: string }
  | { key: 'THIRD_PILLAR_RAISE'; tag: string }
  | { key: 'SAVINGS_FUND'; tag: string; savingsFundFeePercent: number }
  | { key: 'SAVINGS_FUND_RECURRING'; tag: string }
  | { key: 'MEMBERSHIP'; tag: string }
  | { key: 'NONE'; tag: string }
);

export type NudgeKey = NudgeDecision['key'];
