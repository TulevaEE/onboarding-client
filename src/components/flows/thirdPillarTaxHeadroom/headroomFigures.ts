import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';

export type HeadroomFigures = {
  expectedIncome: number;
  expectedMonthlyIncome: number;
  expectedMonthsDiffer: boolean;
  limit: number;
  limitIsEstimate: boolean;
  remaining: number;
  refund: number;
  hasNoTaxWin: boolean;
  monthlyPayment: number;
  suggestsRecurringPayment: boolean;
};

export const awaitsExpectedIncome = (headroom: ThirdPillarTaxHeadroom) =>
  headroom.expectedIncomeBasis === 'NO_DATA' && headroom.limit === 0;

export const invitesHeadroomCalculation = (headroom: ThirdPillarTaxHeadroom | null | undefined) =>
  headroom === null || (!!headroom && awaitsExpectedIncome(headroom));

export const headroomFiguresOf = (headroom: ThirdPillarTaxHeadroom): HeadroomFigures => {
  const amounts = headroom.expectedIncome.map(({ amount }) => amount);
  const expectedIncome = amounts.reduce((sum, amount) => sum + amount, 0);
  return {
    expectedIncome,
    expectedMonthlyIncome: Math.floor(expectedIncome / Math.max(amounts.length, 1)),
    expectedMonthsDiffer: new Set(amounts).size > 1,
    limit: headroom.limit,
    limitIsEstimate: headroom.limitCertainty === 'ESTIMATED',
    remaining: headroom.remaining,
    refund: headroom.refund,
    hasNoTaxWin: headroom.limit === 0,
    monthlyPayment: headroom.monthlyPayment,
    suggestsRecurringPayment: headroom.paymentSuggestion === 'RECURRING',
  };
};

export const monthNumberOf = (yearMonth: string) => Number(yearMonth.split('-')[1]);
