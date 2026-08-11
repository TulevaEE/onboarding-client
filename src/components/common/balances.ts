import { PortfolioGroup, SourceFund } from './apiModels';

// What someone holds is their units plus the money the register has taken in but not
// turned into units yet. Leaving the second half out understates the balance, so every
// place that answers "how much do I have" adds both.
export const pillarBalance = (sourceFunds: SourceFund[], pillar: 2 | 3): number =>
  sourceFunds
    .filter((fund) => fund.pillar === pillar)
    .reduce((sum, fund) => sum + fund.price + fund.unavailablePrice, 0);

export const fundBalance = (fund: SourceFund): number => fund.price + fund.unavailablePrice;

// A group the register said nothing about is left out rather than reported as nothing:
// a statement that has not arrived is not a balance of zero.
export const currentValueByGroup = (
  sourceFunds: SourceFund[] | undefined,
  savingsFundBalance: SourceFund | null | undefined,
): Partial<Record<PortfolioGroup, number>> => {
  const values: Partial<Record<PortfolioGroup, number>> = {};

  ([2, 3] as const).forEach((pillar) => {
    if (sourceFunds?.some((fund) => fund.pillar === pillar)) {
      values[pillar === 2 ? 'SECOND_PILLAR' : 'THIRD_PILLAR'] = pillarBalance(sourceFunds, pillar);
    }
  });

  if (savingsFundBalance) {
    values.SAVINGS_FUND = fundBalance(savingsFundBalance);
  }

  return values;
};
