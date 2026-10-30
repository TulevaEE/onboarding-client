import { hasPillar } from './age66Answers';
import { CostLevel } from './engine/expenses';
import { isLevelEdited, levelNeed } from './expensesAnswers';
import { ResultContext } from './resultAnswers';
import { amountOf, hasJoinedThirdPillar } from './youAnswers';

export type FundAssumptionId = 'secondPillarFund' | 'thirdPillarFund';

export type Assumption =
  | {
      id: 'you';
      birthYear: number;
      secondPillar: number | null;
      thirdPillar: number | null;
      specialPension: number | null;
    }
  | { id: FundAssumptionId; returnPercent: number }
  | { id: 'expenses'; level: CostLevel; amount: number; isEdited: boolean };

const amountIf = (isPresent: boolean, typed: string): number | null =>
  isPresent ? amountOf(typed) : null;

export const assumptionsOf = (context: ResultContext): Assumption[] => {
  const { you, plan, expenses, specialPension } = context;
  const hasSecondPillar = hasPillar('secondPillar', context);
  const hasThirdPillar = hasPillar('thirdPillar', context);
  const specialMonthly = amountOf(specialPension.monthly);
  const thirdPillarSaved = hasJoinedThirdPillar(you) ? amountOf(you.thirdPillarAmount) : 0;
  const assumptions: (Assumption | false)[] = [
    {
      id: 'you',
      birthYear: plan.birthYear,
      secondPillar: amountIf(hasSecondPillar, you.secondPillarAmount),
      thirdPillar: hasThirdPillar ? thirdPillarSaved : null,
      specialPension: plan.hasSpecialPension && specialMonthly > 0 ? specialMonthly : null,
    },
    hasSecondPillar && { id: 'secondPillarFund', returnPercent: you.secondPillarReturnPercent },
    hasThirdPillar && { id: 'thirdPillarFund', returnPercent: you.thirdPillarReturnPercent },
    {
      id: 'expenses',
      level: expenses.level,
      amount: levelNeed(expenses, expenses.level),
      isEdited: isLevelEdited(expenses, expenses.level),
    },
  ];
  return assumptions.filter((assumption): assumption is Assumption => assumption !== false);
};
