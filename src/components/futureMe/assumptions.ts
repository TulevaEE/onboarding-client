import { hasPillar } from './age66Answers';
import { CostLevel } from './engine/expenses';
import { isLevelEdited, levelNeed } from './expensesAnswers';
import { ResultContext } from './resultAnswers';
import { amountOf, FUND_RETURNS, FundKey } from './youAnswers';

export type FundAssumptionId = 'secondPillarFund' | 'thirdPillarFund';

export type Assumption =
  | {
      id: 'you';
      birthYear: number;
      secondPillar: number | null;
      thirdPillar: number | null;
      specialPension: number | null;
    }
  | { id: FundAssumptionId; fund: FundKey; realReturn: number }
  | { id: 'expenses'; level: CostLevel; amount: number; isEdited: boolean };

const amountIf = (isPresent: boolean, typed: string): number | null =>
  isPresent ? amountOf(typed) : null;

const fundAssumption = (id: FundAssumptionId, fund: FundKey): Assumption => ({
  id,
  fund,
  realReturn: FUND_RETURNS[fund],
});

export const assumptionsOf = (context: ResultContext): Assumption[] => {
  const { you, plan, expenses, specialPension } = context;
  const hasSecondPillar = hasPillar('secondPillar', context);
  const hasThirdPillar = hasPillar('thirdPillar', context);
  const specialMonthly = amountOf(specialPension.monthly);
  const assumptions: (Assumption | false)[] = [
    {
      id: 'you',
      birthYear: plan.birthYear,
      secondPillar: amountIf(hasSecondPillar, you.secondPillarAmount),
      thirdPillar: amountIf(hasThirdPillar, you.thirdPillarAmount),
      specialPension: plan.hasSpecialPension && specialMonthly > 0 ? specialMonthly : null,
    },
    hasSecondPillar && fundAssumption('secondPillarFund', you.secondPillarFund),
    hasThirdPillar && fundAssumption('thirdPillarFund', you.thirdPillarFund),
    {
      id: 'expenses',
      level: expenses.level,
      amount: levelNeed(expenses, expenses.level),
      isEdited: isLevelEdited(expenses, expenses.level),
    },
  ];
  return assumptions.filter((assumption): assumption is Assumption => assumption !== false);
};
