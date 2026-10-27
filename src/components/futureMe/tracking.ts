import { trackCustomEvent } from '../tracking/actions';
import { measuredStep, StepId } from './steps';

export const FUTURE_ME_STEP_EVENT = 'future_me_samm';

export const trackFutureMeStep = (step: StepId): void => {
  const samm = measuredStep(step);
  if (samm !== null) {
    trackCustomEvent(FUTURE_ME_STEP_EVENT, { samm });
  }
};
