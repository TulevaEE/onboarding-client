import { Age60Answers } from './age60Answers';
import { PensionInput, statePensionCutForWorkingLess } from './engine/pension';
import { ageTense, hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { StepPlanInput } from './steps';
import { amountOf, thirdPillarMonthlyOf, YouAnswers } from './youAnswers';

export interface PayFromPayoutAge {
  age: number;
  gross: number;
  thirdPillarMonthly: number;
  isThirdPillarAsked: boolean;
}

export const payFromPayoutAgeOf = (
  { reducedPay }: Pick<Age60Answers, 'reducedPay'>,
  you: YouAnswers,
  plan: StepPlanInput,
): PayFromPayoutAge | null => {
  const age = payoutAge(plan);
  if (!reducedPay || ageTense(plan.birthYear, age) === 'past') {
    return null;
  }
  const isThirdPillarAsked = hasThirdPillarAt(you, plan, age);
  return {
    age,
    gross: amountOf(reducedPay.gross ?? you.grossMonthly),
    thirdPillarMonthly:
      isThirdPillarAsked && reducedPay.thirdPillarMonthly !== undefined
        ? amountOf(reducedPay.thirdPillarMonthly)
        : thirdPillarMonthlyOf(you),
    isThirdPillarAsked,
  };
};

export const reducedPayInputOf = (
  age60: Pick<Age60Answers, 'reducedPay'>,
  you: YouAnswers,
  plan: StepPlanInput,
): Pick<PensionInput, 'reducedFrom' | 'reducedGross' | 'reducedP3Monthly'> => {
  const pay = payFromPayoutAgeOf(age60, you, plan);
  return pay
    ? { reducedFrom: pay.age, reducedGross: pay.gross, reducedP3Monthly: pay.thirdPillarMonthly }
    : {};
};

export const grossFromPayoutAgeOf = (
  age60: Pick<Age60Answers, 'reducedPay'>,
  you: YouAnswers,
  plan: StepPlanInput,
): number => payFromPayoutAgeOf(age60, you, plan)?.gross ?? amountOf(you.grossMonthly);

export const statePensionAtRetirementOf = (
  age60: Pick<Age60Answers, 'reducedPay'>,
  you: YouAnswers,
  plan: StepPlanInput,
): number =>
  Math.max(
    0,
    amountOf(you.firstPillarMonthly) -
      statePensionCutForWorkingLess(
        {
          birthYear: plan.birthYear,
          grossMonthly: amountOf(you.grossMonthly),
          p2Rate: Number(you.secondPillarRate) || 0,
          ...reducedPayInputOf(age60, you, plan),
        },
        retirementAge(plan),
      ),
  );
