import { NavValue, Transaction } from '../../common/apiModels';
import { getPeriodSummary, getStackedSeries, navAt, unitsAt, valueAt } from './portfolio';

const TKF = 'EE0000003283';
const PILLAR_2 = 'EE3600109435';

const buy = (isin: string, time: string, units: number, nav: number): Transaction => ({
  id: `buy-${isin}-${time}`,
  amount: units * nav,
  currency: 'EUR',
  time,
  isin,
  type: 'CONTRIBUTION_CASH',
  units,
  nav,
});

const sell = (isin: string, time: string, units: number, nav: number): Transaction => ({
  ...buy(isin, time, units, nav),
  id: `sell-${isin}-${time}`,
  type: 'SUBTRACTION',
});

const navs = (entries: [string, number][]): NavValue[] =>
  entries.map(([date, value]) => ({ date, value }));

const tkfNavs = navs([
  ['2025-01-01', 10],
  ['2025-06-30', 11],
  ['2025-12-31', 12],
]);

const pillar2Navs = navs([
  ['2025-01-01', 2],
  ['2025-06-30', 2.5],
  ['2025-12-31', 3],
]);

const history: Transaction[] = [
  buy(TKF, '2025-01-01T10:00:00Z', 100, 10),
  buy(TKF, '2025-06-30T10:00:00Z', 50, 11),
  buy(PILLAR_2, '2025-01-01T10:00:00Z', 200, 2),
];

const navHistory = { [TKF]: tkfNavs, [PILLAR_2]: pillar2Navs };

describe('portfolio valuation from daily NAV', () => {
  it('uses the latest published price on or before the date', () => {
    expect(navAt(tkfNavs, '2025-06-30')).toBe(11);
    expect(navAt(tkfNavs, '2025-09-15')).toBe(11);
    expect(navAt(tkfNavs, '2024-12-31')).toBeNull();
  });

  it('counts units held on a date, net of redemptions', () => {
    expect(unitsAt(history, TKF, '2025-01-01')).toBe(100);
    expect(unitsAt(history, TKF, '2025-06-30')).toBe(150);
    expect(
      unitsAt([...history, sell(TKF, '2025-07-01T10:00:00Z', 30, 11)], TKF, '2025-07-01'),
    ).toBe(120);
  });

  it('values a date even when nothing was transacted that day', () => {
    // 150 units at the 30.06 price of 11, held untouched through September
    expect(valueAt(history, navHistory, [TKF], '2025-09-15')).toBeCloseTo(1650, 2);
  });

  it('adds up the selected funds only', () => {
    expect(valueAt(history, navHistory, [TKF], '2025-12-31')).toBeCloseTo(1800, 2);
    expect(valueAt(history, navHistory, [PILLAR_2], '2025-12-31')).toBeCloseTo(600, 2);
    expect(valueAt(history, navHistory, [TKF, PILLAR_2], '2025-12-31')).toBeCloseTo(2400, 2);
  });
});

describe('period summary', () => {
  it('reports the gain earned between two chosen dates', () => {
    const summary = getPeriodSummary(history, navHistory, [TKF], '2025-06-30', '2025-12-31');

    // Opens with the 100 units held before 30.06 (priced at the 01.01 nav of 10),
    // then 550 is paid in during the period and it closes at 150 × 12.
    expect(summary.startValue).toBeCloseTo(1000, 2);
    expect(summary.endValue).toBeCloseTo(1800, 2);
    expect(summary.contributions).toBeCloseTo(550, 2);
    expect(summary.withdrawals).toBe(0);
    expect(summary.gain).toBeCloseTo(250, 2);
  });

  it('measures growth over a period with no cash flows', () => {
    const summary = getPeriodSummary(history, navHistory, [TKF], '2025-07-01', '2025-12-31');

    expect(summary.startValue).toBeCloseTo(1650, 2);
    expect(summary.endValue).toBeCloseTo(1800, 2);
    expect(summary.contributions).toBe(0);
    expect(summary.gain).toBeCloseTo(150, 2);
    expect(summary.gainPercentage).toBeCloseTo(9.09, 1);
  });

  it('builds a series from the days a price was published in the period', () => {
    const summary = getPeriodSummary(history, navHistory, [TKF], '2025-01-01', '2025-12-31');

    expect(summary.series.map((point) => point.date)).toEqual([
      '2025-01-01',
      '2025-06-30',
      '2025-12-31',
    ]);
    expect(summary.series[2].value).toBeCloseTo(1800, 2);
  });

  it('is empty and safe when no prices are known', () => {
    const summary = getPeriodSummary(history, {}, [TKF], '2025-01-01', '2025-12-31');

    expect(summary.endValue).toBe(0);
    expect(summary.series).toEqual([]);
  });
});

describe('unpriced holdings', () => {
  it('reports no value while a held fund has no published price', () => {
    // Units bought on 01.01, but the price series only starts on 30.06.
    const lateNavs = { [TKF]: navs([['2025-06-30', 11]]) };

    expect(valueAt(history, lateNavs, [TKF], '2025-01-15')).toBeNull();
    expect(valueAt(history, lateNavs, [TKF], '2025-06-30')).toBeCloseTo(1650, 2);
  });

  it('ignores funds that are not held rather than blanking the whole total', () => {
    const onlyTkfPrices = { [TKF]: tkfNavs };

    expect(valueAt(history, onlyTkfPrices, [TKF, 'EE_NEVER_HELD'], '2025-12-31')).toBeCloseTo(
      1800,
      2,
    );
  });

  it('leaves unpriced dates out of the chart instead of drawing them as zero', () => {
    const lateNavs = {
      [TKF]: navs([
        ['2025-06-30', 11],
        ['2025-12-31', 12],
      ]),
    };
    const summary = getPeriodSummary(history, lateNavs, [TKF], '2025-01-01', '2025-12-31');

    expect(summary.series.map((point) => point.date)).toEqual(['2025-06-30', '2025-12-31']);
    expect(summary.series.every((point) => point.value > 0)).toBe(true);
  });
});

describe('stacked series', () => {
  const layers = [
    { id: 'savingsFund', isins: [TKF] },
    { id: 'secondPillar', isins: [PILLAR_2] },
  ];

  it('values every layer on the same dates and totals them', () => {
    const series = getStackedSeries(history, navHistory, layers, '2025-01-01', '2025-12-31');

    const last = series[series.length - 1];
    expect(last.date).toBe('2025-12-31');
    expect(last.values[0]).toBeCloseTo(1800, 2);
    expect(last.values[1]).toBeCloseTo(600, 2);
    expect(last.total).toBeCloseTo(2400, 2);
  });

  it('drops dates where any held layer is unpriced', () => {
    const partial = { [TKF]: tkfNavs, [PILLAR_2]: navs([['2025-12-31', 3]]) };
    const series = getStackedSeries(history, partial, layers, '2025-01-01', '2025-12-31');

    expect(series.map((point) => point.date)).toEqual(['2025-12-31']);
  });
});

describe('cash flow on the opening day', () => {
  it('does not subtract a from-date deposit twice', () => {
    // The All time preset starts on the first transaction date, so this is its normal case.
    const firstDay = [buy(TKF, '2025-01-01T10:00:00Z', 100, 10)];
    const flatNavs = { [TKF]: navs([['2025-01-01', 10]]) };

    const summary = getPeriodSummary(firstDay, flatNavs, [TKF], '2025-01-01', '2025-01-01');

    expect(summary.startValue).toBe(0);
    expect(summary.contributions).toBeCloseTo(1000, 2);
    expect(summary.endValue).toBeCloseTo(1000, 2);
    expect(summary.gain).toBeCloseTo(0, 2);
  });
});
