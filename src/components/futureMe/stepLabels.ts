import { IntlShape } from 'react-intl';
import { TranslationKey } from '../translations';
import { retirementAge } from './age65Answers';
import { payoutAge } from './age60Answers';
import { retirementYears } from './engine/pension';
import { FutureMeStep, StepId, StepPlanInput } from './steps';

const STEP_LABEL_KEYS: Record<StepId, TranslationKey> = {
  [FutureMeStep.YOU]: 'futureMe.trail.step.you',
  [FutureMeStep.EARLY_WITHDRAWAL]: 'futureMe.trail.step.earlyWithdrawal',
  [FutureMeStep.AGE_55]: 'futureMe.trail.step.age55',
  [FutureMeStep.AGE_60]: 'futureMe.trail.step.age60',
  [FutureMeStep.AGE_65]: 'futureMe.trail.step.age65',
  [FutureMeStep.AGE_66_PLUS]: 'futureMe.trail.step.age66Plus',
  [FutureMeStep.COSTS]: 'futureMe.trail.step.costs',
  [FutureMeStep.SPECIAL_PENSION]: 'futureMe.trail.step.specialPension',
  [FutureMeStep.RESULT]: 'futureMe.trail.step.result',
};

const SUB_LABEL_KEYS: Partial<Record<StepId, TranslationKey>> = {
  [FutureMeStep.AGE_60]: 'futureMe.trail.sub.pillars',
  [FutureMeStep.AGE_65]: 'futureMe.trail.sub.pension',
};

const stepAge = (step: StepId, plan: StepPlanInput): number => {
  switch (step) {
    case FutureMeStep.AGE_60:
      return payoutAge(plan);
    case FutureMeStep.AGE_65:
      return retirementAge(plan);
    default:
      return plan.specialPensionStartAge ?? retirementYears(plan);
  }
};

export const stepLabel = (intl: IntlShape, step: StepId, plan: StepPlanInput): string =>
  intl.formatMessage({ id: STEP_LABEL_KEYS[step] }, { age: stepAge(step, plan) });

export const stepSublabel = (intl: IntlShape, step: StepId, plan: StepPlanInput): string => {
  const key = SUB_LABEL_KEYS[step];
  return key && payoutAge(plan) === retirementAge(plan) ? intl.formatMessage({ id: key }) : '';
};
