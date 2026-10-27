import { trackCustomEvent } from '../tracking/actions';
import { measuredStep, StepId } from './steps';

export const trackFutureMeStep = (step: StepId): void => {
  const measured = measuredStep(step);
  if (measured !== null) {
    trackCustomEvent('future_me_step', { step: measured });
  }
};
