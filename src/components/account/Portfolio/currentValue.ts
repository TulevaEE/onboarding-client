import { PortfolioGroupSummary } from '../../common/apiModels';

// The register holds money it has not turned into units yet, and a value rebuilt from
// units alone cannot see it. Where the register has spoken for a group, its balance is
// what the account page shows — so it is what this page shows too, and the gain is
// restated around it rather than left describing a closing value nobody is looking at.
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
