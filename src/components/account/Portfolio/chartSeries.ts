import { PortfolioGroup, PortfolioValuePoint } from '../../common/apiModels';
import { ChartPoint } from './ValueChart';

/**
 * Turns the backend's day-by-day values into the points a stacked chart can draw.
 *
 * Someone who has held a pillar since 2005 and the savings fund since 2024 should still
 * see all of the pillar history, so the days before a band existed keep the bands that
 * did — the newcomer is simply absent there rather than drawn as a zero, which would
 * read as a cliff on the day its price history begins. Once a band has started
 * publishing, a day it has no price for is left out altogether: half a stack would
 * understate what the person is worth.
 */
export const buildChartSeries = (
  series: PortfolioValuePoint[],
  visible: PortfolioGroup[],
): ChartPoint[] => {
  const valueAt = (point: PortfolioValuePoint, group: PortfolioGroup): number | null => {
    const value = point.values[group];
    return typeof value === 'number' ? value : null;
  };

  const historyStarts = visible.map((group) =>
    series.findIndex((point) => valueAt(point, group) !== null),
  );

  return series.flatMap((point, index) => {
    const values = visible.map((group) => valueAt(point, group));

    const hasGap = values.some(
      (value, band) => value === null && historyStarts[band] !== -1 && index >= historyStarts[band],
    );
    const beforeAllHistory = values.every((value) => value === null);

    if (hasGap || beforeAllHistory) {
      return [];
    }

    return [
      {
        date: point.date,
        values,
        total: values.reduce<number>((sum, value) => sum + (value ?? 0), 0),
      },
    ];
  });
};
