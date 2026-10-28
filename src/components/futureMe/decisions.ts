import { PAYOUT_CHOICES } from './age60Answers';
import {
  deferralLock,
  isPayoutChoiceMadeAtAnotherStep,
  PENSION_MODES,
  withMode,
} from './age65Answers';
import { Pillar } from './age66Answers';
import { hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { MAX_AGE_SHOWN, Result, ResultContext } from './resultAnswers';

export type DecisionId =
  | 'secondPillarAtPayoutAge'
  | 'thirdPillarAtPayoutAge'
  | 'statePension'
  | 'secondPillarAtPensionAge'
  | 'thirdPillarAtPensionAge';

export interface Decision {
  id: DecisionId;
  age: number;
  year: number;
  current: string;
  choices: string[];
}

export type DecisionChanges = Partial<Pick<ResultContext, 'age60' | 'age65' | 'expenses'>>;

const decisionAt = (
  { plan }: ResultContext,
  id: DecisionId,
  age: number,
  current: string,
  choices: string[],
): Decision => ({ id, age, year: plan.birthYear + age, current, choices });

const payoutDecision = (
  context: ResultContext,
  id: DecisionId,
  pillar: Pillar,
  stage: 'age60' | 'age65',
): Decision => {
  const age = stage === 'age60' ? payoutAge(context.plan) : retirementAge(context.plan);
  return decisionAt(context, id, age, context[stage][pillar], PAYOUT_CHOICES);
};

const isLeftGrowingAtPayoutAge = ({ age60, plan }: ResultContext, pillar: Pillar): boolean =>
  age60[pillar] === 'grow' && !isPayoutChoiceMadeAtAnotherStep(plan);

export const decisionsOf = (context: ResultContext): Decision[] => {
  const { you, plan } = context;
  const hasSecondPillar = plan.savesInSecondPillar;
  const hasThirdPillarAtPayoutAge = hasThirdPillarAt(you, plan, payoutAge(plan));
  const hasThirdPillarAtPensionAge = hasThirdPillarAt(you, plan, retirementAge(plan));
  const decisions = [
    hasSecondPillar && payoutDecision(context, 'secondPillarAtPayoutAge', 'secondPillar', 'age60'),
    hasThirdPillarAtPayoutAge &&
      payoutDecision(context, 'thirdPillarAtPayoutAge', 'thirdPillar', 'age60'),
    deferralLock(you) === null &&
      decisionAt(context, 'statePension', retirementAge(plan), context.age65.mode, PENSION_MODES),
    hasSecondPillar &&
      isLeftGrowingAtPayoutAge(context, 'secondPillar') &&
      payoutDecision(context, 'secondPillarAtPensionAge', 'secondPillar', 'age65'),
    hasThirdPillarAtPensionAge &&
      isLeftGrowingAtPayoutAge(context, 'thirdPillar') &&
      payoutDecision(context, 'thirdPillarAtPensionAge', 'thirdPillar', 'age65'),
  ];
  return decisions.filter((decision): decision is Decision => decision !== false);
};

const PAYOUT_DECISION_FIELDS: Record<
  Exclude<DecisionId, 'statePension'>,
  { stage: 'age60' | 'age65'; pillar: Pillar }
> = {
  secondPillarAtPayoutAge: { stage: 'age60', pillar: 'secondPillar' },
  thirdPillarAtPayoutAge: { stage: 'age60', pillar: 'thirdPillar' },
  secondPillarAtPensionAge: { stage: 'age65', pillar: 'secondPillar' },
  thirdPillarAtPensionAge: { stage: 'age65', pillar: 'thirdPillar' },
};

export const withDecision = (
  context: ResultContext,
  id: DecisionId,
  choice: string,
): DecisionChanges => {
  if (id === 'statePension') {
    return { age65: withMode(context.age65, choice as (typeof PENSION_MODES)[number]) };
  }
  const { stage, pillar } = PAYOUT_DECISION_FIELDS[id];
  return { [stage]: { ...context[stage], [pillar]: choice } };
};

export const coversAgeOf = (result: Result): number =>
  result.coversNeedUntil === null || result.gapTemporary ? MAX_AGE_SHOWN : result.coversNeedUntil;
