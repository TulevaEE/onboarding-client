import { Age60Answers } from './age60Answers';
import { PensionInput } from './engine/pension';
import { hasThirdPillarAt, payoutAge } from './planAges';
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
  if (!reducedPay) {
    return null;
  }
  const age = payoutAge(plan);
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
