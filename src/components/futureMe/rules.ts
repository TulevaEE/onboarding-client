import { pensionKind } from './age65Answers';
import { Contract, hasPillar, Pillar } from './age66Answers';
import { EARLY_DECREASE, retirementYears, SimulationResult } from './engine/pension';
import { retirementAge } from './planAges';
import { ResultContext, resultInputOf, resultOf, resultScenarioOf } from './resultAnswers';
import { specialPensionStartAge } from './specialPensionAnswers';
import {
  amountOf,
  earlyRightSources,
  KidsInForecast,
  kidsInForecastOf,
  YouAnswers,
} from './youAnswers';

type EarlyRightReason = keyof ReturnType<typeof earlyRightSources>;

interface When {
  age: number | null;
  year: number | null;
}

export type Rule = When &
  (
    | { id: 'earlyRetirement'; years: number; pensionAge: number; reason: EarlyRightReason }
    | { id: 'flexibleRetirement'; years: number; decrease: number }
    | { id: 'childSupplement'; monthly: number; inForecast: KidsInForecast }
    | { id: 'specialPension'; monthly: number; startAge: number | undefined }
    | { id: 'fundPensionContract'; contracts: Partial<Record<Pillar, Contract>> }
    | { id: 'inheritance'; pillars: 'both' | Pillar }
  );

const FUND_PENSION_SCENARIOS = ['B', 'C', 'D'];
const PAID_FROM = 0.5;

const whenOf = (context: ResultContext, age: number | null): When => ({
  age,
  year: age === null ? null : context.plan.birthYear + age,
});

const earlyRightReason = (you: YouAnswers): EarlyRightReason => {
  const sources = earlyRightSources(you);
  return (Object.keys(sources) as EarlyRightReason[]).reduce((largest, reason) =>
    sources[reason] > sources[largest] ? reason : largest,
  );
};

const earlyRetirementRules = (context: ResultContext): Rule[] => {
  const { you, plan } = context;
  const years = plan.earlyRetirementYears;
  const when = whenOf(context, retirementAge(plan));
  if (years === 0) {
    return [];
  }
  return [
    pensionKind(you) === 'flexible'
      ? { id: 'flexibleRetirement', ...when, years, decrease: EARLY_DECREASE[years] }
      : {
          id: 'earlyRetirement',
          ...when,
          years,
          pensionAge: retirementYears(plan),
          reason: earlyRightReason(you),
        },
  ];
};

const oldAgePensionStartAge = (
  { firstPillar, rescueAllowance, p1StartAge }: SimulationResult,
  specialStartAge: number,
): number | null => {
  const isOldAgePaidBeforeSpecial = p1StartAge < specialStartAge;
  if (firstPillar?.paid === 'special' && !isOldAgePaidBeforeSpecial) {
    return firstPillar.atPa?.paid === 'oldAge' ? firstPillar.atPa.age : null;
  }
  return rescueAllowance?.until ?? p1StartAge;
};

const childSupplementRules = (context: ResultContext): Rule[] => {
  const result = resultOf(context);
  const age = oldAgePensionStartAge(result, specialPensionStartAge(context.plan));
  return result.childSupplement && age !== null
    ? [
        {
          id: 'childSupplement',
          ...whenOf(context, age),
          monthly: result.childSupplement.monthly,
          inForecast: kidsInForecastOf(context.you),
        },
      ]
    : [];
};

const specialPensionRules = (context: ResultContext): Rule[] => {
  const { plan, specialPension } = context;
  const monthly = amountOf(specialPension.monthly);
  return plan.hasSpecialPension && monthly > 0
    ? [
        {
          id: 'specialPension',
          ...whenOf(context, specialPensionStartAge(plan)),
          monthly,
          startAge: plan.specialPensionStartAge,
        },
      ]
    : [];
};

const fundPensionRules = (context: ResultContext): Rule[] => {
  const { age66, plan } = context;
  const isSecondPillarFund =
    hasPillar('secondPillar', context) &&
    FUND_PENSION_SCENARIOS.includes(resultScenarioOf(context).id);
  const isThirdPillarFund = resultInputOf(context).p3Sep?.mode === 'fund';
  const contracts = {
    ...(isSecondPillarFund && { secondPillar: age66.secondPillarContract }),
    ...(isThirdPillarFund && { thirdPillar: age66.thirdPillarContract }),
  };
  if (Object.keys(contracts).length === 0) {
    return [];
  }
  const result = resultOf(context);
  const firstFundPayment = result.rows.find(
    ({ age, fp }) => age >= result.pensionStartAge && fp > PAID_FROM,
  );
  return [
    {
      id: 'fundPensionContract',
      ...whenOf(context, firstFundPayment?.age ?? retirementYears(plan)),
      contracts,
    },
  ];
};

const inheritingPillar = (hasSecondPillar: boolean): Pillar =>
  hasSecondPillar ? 'secondPillar' : 'thirdPillar';

const inheritanceRules = (context: ResultContext): Rule[] => {
  const hasSecondPillar = hasPillar('secondPillar', context);
  const hasThirdPillar = hasPillar('thirdPillar', context);
  if (!hasSecondPillar && !hasThirdPillar) {
    return [];
  }
  const pillars = hasSecondPillar && hasThirdPillar ? 'both' : inheritingPillar(hasSecondPillar);
  return [{ id: 'inheritance', ...whenOf(context, null), pillars }];
};

const byAge = (a: Rule, b: Rule): number =>
  (a.age ?? Number.POSITIVE_INFINITY) - (b.age ?? Number.POSITIVE_INFINITY);

export const rulesOf = (context: ResultContext): Rule[] =>
  [
    ...earlyRetirementRules(context),
    ...childSupplementRules(context),
    ...specialPensionRules(context),
    ...fundPensionRules(context),
    ...inheritanceRules(context),
  ].sort(byAge);
