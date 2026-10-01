import { PortfolioGroupSummary } from '../../common/apiModels';

export const withCurrentValue = (
  summary: PortfolioGroupSummary,
  currentValue: number | undefined,
): PortfolioGroupSummary => {
  if (currentValue === undefined) {
    return summary;
  }
  const { startValue, contributions, withdrawals } = summary;
  return {
    ...summary,
    endValue: currentValue,
    gain: startValue === null ? null : currentValue + withdrawals - startValue - contributions,
  };
};
