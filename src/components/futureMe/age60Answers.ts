import { FutureMeStep, StepId } from './steps';

export type PayoutChoice = 'grow' | 'fund' | 'lump';
export type DecisionOrdinal = 'first' | 'second';

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

const DECISION_ORDINALS: DecisionOrdinal[] = ['first', 'second'];
const EARLIER_DECISION_STEPS: StepId[] = [FutureMeStep.AGE_55];

export const decisionOrdinal = (steps: StepId[]): DecisionOrdinal =>
  DECISION_ORDINALS[EARLIER_DECISION_STEPS.filter((step) => steps.includes(step)).length];
