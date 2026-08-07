import { PortfolioValuePoint } from '../../common/apiModels';
import { buildChartSeries } from './chartSeries';

const point = (date: string, values: PortfolioValuePoint['values']): PortfolioValuePoint => ({
  date,
  values,
});

describe('the points a stacked chart is given to draw', () => {
  it('begins where the longest held band begins, not where the newest one does', () => {
    const series = buildChartSeries(
      [
        point('2005-01-01', { SECOND_PILLAR: 100 }),
        point('2024-01-01', { SECOND_PILLAR: 200, SAVINGS_FUND: 50 }),
        point('2025-01-01', { SECOND_PILLAR: 300, SAVINGS_FUND: 60 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(series.map(({ date }) => date)).toEqual(['2005-01-01', '2024-01-01', '2025-01-01']);
  });

  it('leaves a band out of the days before it existed instead of drawing it as zero', () => {
    const [first] = buildChartSeries(
      [
        point('2005-01-01', { SECOND_PILLAR: 100 }),
        point('2024-01-01', { SECOND_PILLAR: 200, SAVINGS_FUND: 50 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(first.values).toEqual([100, null]);
    expect(first.total).toBe(100);
  });

  it('reads a band the backend spelled out as null before it existed the same way', () => {
    const [first] = buildChartSeries(
      [
        point('2005-01-01', { SECOND_PILLAR: 100, SAVINGS_FUND: null }),
        point('2024-01-01', { SECOND_PILLAR: 200, SAVINGS_FUND: 50 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(first.values).toEqual([100, null]);
  });

  it('drops the days before any of the shown bands was worth anything', () => {
    const series = buildChartSeries(
      [
        point('2023-01-01', { SECOND_PILLAR: null }),
        point('2024-01-01', { SECOND_PILLAR: 200, SAVINGS_FUND: 50 }),
        point('2025-01-01', { SECOND_PILLAR: 300, SAVINGS_FUND: 60 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(series.map(({ date }) => date)).toEqual(['2024-01-01', '2025-01-01']);
  });

  it('drops a day a band skipped once its own history had begun', () => {
    const series = buildChartSeries(
      [
        point('2024-01-01', { SECOND_PILLAR: 100, SAVINGS_FUND: 50 }),
        point('2024-01-02', { SECOND_PILLAR: 110, SAVINGS_FUND: null }),
        point('2024-01-03', { SECOND_PILLAR: 120, SAVINGS_FUND: 60 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(series.map(({ date }) => date)).toEqual(['2024-01-01', '2024-01-03']);
  });

  it('drops the days a band that had been publishing is missing from the end', () => {
    const series = buildChartSeries(
      [
        point('2024-01-01', { SECOND_PILLAR: 100, SAVINGS_FUND: 50 }),
        point('2024-01-02', { SECOND_PILLAR: 110, SAVINGS_FUND: 60 }),
        point('2024-01-03', { SECOND_PILLAR: 120 }),
      ],
      ['SECOND_PILLAR', 'SAVINGS_FUND'],
    );

    expect(series.map(({ date }) => date)).toEqual(['2024-01-01', '2024-01-02']);
  });

  it('pays no attention to a band nobody asked to see', () => {
    const series = buildChartSeries(
      [
        point('2024-01-01', { SECOND_PILLAR: 100 }),
        point('2024-01-02', { SECOND_PILLAR: 110, SAVINGS_FUND: 60 }),
      ],
      ['SAVINGS_FUND'],
    );

    expect(series).toEqual([{ date: '2024-01-02', values: [60], total: 60 }]);
  });
});
