import { PAYOUT_CHOICES } from './age60Answers';
import {
  deferralLock,
  isPayoutChoiceMadeAtAnotherStep,
  PENSION_MODES,
  withMode,
} from './age65Answers';
import { Age66Context, fundStartOf, isContractAsked, isGrowing, Pillar } from './age66Answers';
import { hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { euro } from './amountFormat';
import { MAX_AGE_SHOWN, Result, ResultContext } from './resultAnswers';
import { specialPensionStartAge } from './specialPensionAnswers';
import { amountOf } from './youAnswers';

export type DecisionId =
  | 'secondPillarAtPayoutAge'
  | 'thirdPillarAtPayoutAge'
  | 'statePension'
  | 'secondPillarAtPensionAge'
  | 'thirdPillarAtPensionAge'
  | 'specialPension'
  | 'fundPension';

export type StepDecisionId = Extract<DecisionId, 'specialPension' | 'fundPension'>;

export const isStepDecision = (id: DecisionId): id is StepDecisionId =>
  id === 'specialPension' || id === 'fundPension';

export interface Decision {
  id: DecisionId;
  age: number;
  year: number;
  current: string;
  choices: string[];
  summary: Record<string, string | number>;
}

export type DecisionChanges = Partial<Omit<ResultContext, 'plan'>>;

const decisionAt = (
  { plan }: ResultContext,
  id: DecisionId,
  age: number,
  current: string,
  choices: string[],
  summary: Decision['summary'] = {},
): Decision => ({ id, age, year: plan.birthYear + age, current, choices, summary });

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

const specialPensionDecision = (context: ResultContext): Decision => {
  const monthly = amountOf(context.specialPension.monthly);
  return decisionAt(context, 'specialPension', specialPensionStartAge(context.plan), '', [], {
    hasMonthly: monthly > 0 ? 'yes' : 'no',
    monthly: euro(monthly),
  });
};

const fundPensionKind = (
  startAge: number | undefined,
  isAnyGrowing: boolean,
): 'start' | 'none' | 'contract' => {
  if (startAge !== undefined) {
    return 'start';
  }
  return isAnyGrowing ? 'none' : 'contract';
};

const fundPensionDecision = (context: ResultContext): Decision | false => {
  const { age60, age65, age66, you, plan } = context;
  const fundContext: Age66Context = { age60, age65, you, plan };
  const pillars: Pillar[] = ['secondPillar', 'thirdPillar'];
  const startAges = pillars
    .map((pillar) => fundStartOf(pillar, age66, fundContext))
    .filter((age): age is number => age !== undefined);
  const isAnyGrowing = pillars.some((pillar) => isGrowing(pillar, fundContext));
  const isAnyContractAsked = pillars.some((pillar) => isContractAsked(pillar, age66, fundContext));
  if (!isAnyGrowing && !isAnyContractAsked) {
    return false;
  }
  const startAge = startAges.length > 0 ? Math.min(...startAges) : undefined;
  return decisionAt(context, 'fundPension', startAge ?? retirementAge(plan) + 1, '', [], {
    kind: fundPensionKind(startAge, isAnyGrowing),
    age: startAge ?? 0,
  });
};

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
    plan.hasSpecialPension && specialPensionDecision(context),
    fundPensionDecision(context),
  ];
  return decisions
    .filter((decision): decision is Decision => decision !== false)
    .sort((a, b) => a.age - b.age);
};

const PAYOUT_DECISION_FIELDS: Record<
  Exclude<DecisionId, 'statePension' | StepDecisionId>,
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
  if (isStepDecision(id)) {
    return {};
  }
  const { stage, pillar } = PAYOUT_DECISION_FIELDS[id];
  return { [stage]: { ...context[stage], [pillar]: choice } };
};

export const coversAgeOf = (result: Result): number =>
  result.coversNeedUntil === null || result.gapTemporary ? MAX_AGE_SHOWN : result.coversNeedUntil;
