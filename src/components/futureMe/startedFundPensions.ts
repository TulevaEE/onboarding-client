import { Age60Answers, initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { retirementYears } from './engine/pension';
import { payoutAge } from './planAges';
import { FundPensionChoice } from './prefill';
import { FutureMeStep, StepId, StepPlanInput } from './steps';
import { toStepPlanInput, YouAnswers } from './youAnswers';

type Pillar = 'secondPillar' | 'thirdPillar';

const pillarOf = ({ pillar }: FundPensionChoice): Pillar =>
  pillar === 'SECOND' ? 'secondPillar' : 'thirdPillar';

export const startedFundPensionStep = (
  { pillar, startAge }: FundPensionChoice,
  plan: StepPlanInput,
): StepId => {
  if (startAge >= retirementYears(plan)) {
    return FutureMeStep.AGE_65;
  }
  return startAge >= payoutAge(plan) || pillar === 'SECOND'
    ? FutureMeStep.AGE_60
    : FutureMeStep.AGE_55;
};

export const startedFundPensionAnswers = (
  choices: FundPensionChoice[],
  you: YouAnswers,
): { you: YouAnswers; age60: Age60Answers; age65: Age65Answers } => {
  const plan = toStepPlanInput(you);
  return choices.reduce(
    (answers, choice) => {
      const step = startedFundPensionStep(choice, plan);
      if (step === FutureMeStep.AGE_55) {
        return { ...answers, you: { ...answers.you, thirdPillarPlan: 'fund' } };
      }
      const key = step === FutureMeStep.AGE_60 ? 'age60' : 'age65';
      return { ...answers, [key]: { ...answers[key], [pillarOf(choice)]: 'fund' } };
    },
    { you, age60: initialAge60(), age65: initialAge65() },
  );
};

export const startedFundPensionsAt = (
  choices: FundPensionChoice[],
  step: StepId,
  plan: StepPlanInput,
): Partial<Record<Pillar, FundPensionChoice>> =>
  Object.fromEntries(
    choices
      .filter((choice) => startedFundPensionStep(choice, plan) === step)
      .map((choice) => [pillarOf(choice), choice]),
  );
