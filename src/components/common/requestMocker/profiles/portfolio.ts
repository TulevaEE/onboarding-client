import moment from 'moment';
import { Portfolio, PortfolioGroup } from '../../apiModels';

const day = (daysAgo: number): string => moment().subtract(daysAgo, 'day').format('YYYY-MM-DD');

const DAILY_GROWTH = 0.0003;

const grown = (start: number, index: number): number =>
  Number((start * (1 + DAILY_GROWTH) ** index).toFixed(2));

const series = (days: number, bands: Partial<Record<PortfolioGroup, number>>) =>
  Array.from({ length: days }, (unused, index) => ({
    date: day(days - 1 - index),
    values: Object.fromEntries(
      (Object.entries(bands) as [PortfolioGroup, number][]).map(([group, start]) => [
        group,
        grown(start, index),
      ]),
    ) as Partial<Record<PortfolioGroup, number | null>>,
  }));

const summary = (
  group: PortfolioGroup,
  startValue: number,
  endValue: number,
  annualReturnRate: number | null,
) => ({
  group,
  startValue,
  endValue,
  contributions: 1200,
  withdrawals: 0,
  gain: Number((endValue - startValue - 1200).toFixed(2)),
  gainPercentage: 8.4,
  annualReturnRate,
});

const period = { from: day(899), to: day(0) };

export const portfolioProfiles: Record<string, Portfolio> = {
  ALL_THREE: {
    ...period,
    groups: [
      summary('SAVINGS_FUND', 2000, 4200, null),
      summary('SECOND_PILLAR', 12000, 17800, 0.0712),
      summary('THIRD_PILLAR', 4000, 6400, 0.0584),
    ],
    series: series(900, { SAVINGS_FUND: 2000, SECOND_PILLAR: 12000, THIRD_PILLAR: 4000 }),
  },
  SAVINGS_FUND_ONLY: {
    ...period,
    groups: [summary('SAVINGS_FUND', 2000, 4200, null)],
    series: series(900, { SAVINGS_FUND: 2000 }),
  },
  EMPTY: {
    ...period,
    groups: [],
    series: [],
  },
};
