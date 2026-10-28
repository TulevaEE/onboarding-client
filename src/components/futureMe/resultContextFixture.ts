import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses } from './expensesAnswers';
import { ResultContext } from './resultAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };

export const contextWith = (
  changes: Partial<ReturnType<typeof initialAnswers>> = {},
  rest: Partial<Omit<ResultContext, 'you' | 'plan'>> = {},
): ResultContext => {
  const you = {
    ...initialAnswers(noPrefill),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    ...changes,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
    ...rest,
  };
};
