import { FutureMeStep, StepId } from './steps';

export type PayoutChoice = 'grow' | 'fund' | 'lump';
export type PillarsOpening = 'both' | 'second';

export const PAYOUT_CHOICES: PayoutChoice[] = ['grow', 'fund', 'lump'];
export const PENSION_AGE_PAYOUT_CHOICES: PayoutChoice[] = ['fund', 'grow', 'lump'];

export const PAYOUT_CHOICE_EMOJI: Record<PayoutChoice, string> = {
  grow: '🌱',
  fund: '🗓️',
  lump: '💰',
};

export interface ReducedPay {
  gross?: string;
  thirdPillarMonthly?: string;
}

export interface Age60Answers {
  secondPillar: PayoutChoice;
  thirdPillar: PayoutChoice;
  reducedPay?: ReducedPay;
}

export const initialAge60 = (): Age60Answers => ({ secondPillar: 'grow', thirdPillar: 'grow' });

export const answersChangedFrom = (
  current: Age60Answers,
  next: Age60Answers,
): Partial<Age60Answers> =>
  Object.fromEntries(
    Object.entries(next).filter(([field, value]) => current[field as keyof Age60Answers] !== value),
  );

export const pillarsOpeningAt60 = (steps: StepId[], hasThirdPillar: boolean): PillarsOpening =>
  hasThirdPillar && !steps.includes(FutureMeStep.AGE_55) ? 'both' : 'second';
