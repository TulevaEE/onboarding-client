import { FutureMeStep, StepId } from './steps';

export type PayoutChoice = 'grow' | 'fund' | 'lump';
export type PillarsOpening = 'both' | 'second';

export const PAYOUT_CHOICES: PayoutChoice[] = ['grow', 'fund', 'lump'];

export const PAYOUT_CHOICE_EMOJI: Record<PayoutChoice, string> = {
  grow: '🌱',
  fund: '🗓️',
  lump: '💰',
};

export interface Age60Answers {
  secondPillar: PayoutChoice;
  thirdPillar: PayoutChoice;
}

export const initialAge60 = (): Age60Answers => ({ secondPillar: 'grow', thirdPillar: 'grow' });

export const pillarsOpeningAt60 = (steps: StepId[], hasThirdPillar: boolean): PillarsOpening =>
  hasThirdPillar && !steps.includes(FutureMeStep.AGE_55) ? 'both' : 'second';
