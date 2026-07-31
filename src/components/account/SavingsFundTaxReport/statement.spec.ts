import { Transaction } from '../../common/apiModels';
import { getRealisedGainsBetween } from './statement';

const transaction = (
  time: string,
  units: number,
  nav: number,
  type: Transaction['type'],
): Transaction => ({
  id: `${type}-${time}`,
  amount: units * nav,
  currency: 'EUR',
  time,
  isin: 'EE0000003283',
  type,
  units,
  nav,
});

const buy = (time: string, units: number, nav: number) =>
  transaction(time, units, nav, 'CONTRIBUTION_CASH');
const sell = (time: string, units: number, nav: number) =>
  transaction(time, units, nav, 'SUBTRACTION');

const history: Transaction[] = [
  buy('2024-02-15T10:00:00Z', 100, 10),
  buy('2024-06-03T10:00:00Z', 50, 10.5),
  buy('2025-01-20T10:00:00Z', 80, 11.2),
  sell('2025-09-10T10:00:00Z', 40, 12),
  buy('2025-11-05T10:00:00Z', 30, 11.8),
];

describe('realised gains for the tax return', () => {
  it('uses the oldest units first under FIFO', () => {
    const [gain] = getRealisedGainsBetween(history, '2025-01-01', '2025-12-31', 'FIFO');

    expect(gain.proceeds).toBeCloseTo(480, 2);
    expect(gain.acquisitionCost).toBeCloseTo(400, 2);
    expect(gain.gain).toBeCloseTo(80, 2);
  });

  it('spreads cost across all holdings under the weighted average method', () => {
    const [gain] = getRealisedGainsBetween(history, '2025-01-01', '2025-12-31', 'WEIGHTED_AVERAGE');

    // Holdings on the disposal date are 230 units costing 2421, so 10.5261 per unit.
    // The 30 units bought later that year must not affect this disposal.
    expect(gain.acquisitionCost).toBeCloseTo(421.04, 2);
    expect(gain.gain).toBeCloseTo(58.96, 2);
  });

  it('defaults to the weighted average method', () => {
    const [withDefault] = getRealisedGainsBetween(history, '2025-01-01', '2025-12-31');
    const [explicit] = getRealisedGainsBetween(
      history,
      '2025-01-01',
      '2025-12-31',
      'WEIGHTED_AVERAGE',
    );

    expect(withDefault.gain).toBeCloseTo(explicit.gain, 2);
  });

  it('excludes disposals outside the requested period', () => {
    expect(getRealisedGainsBetween(history, '2024-01-01', '2024-12-31')).toHaveLength(0);
  });

  it('has nothing to report when nothing was ever sold', () => {
    const onlyPurchases = history.filter((item) => item.type === 'CONTRIBUTION_CASH');

    expect(getRealisedGainsBetween(onlyPurchases, '2020-01-01', '2026-12-31')).toEqual([]);
  });

  it('prices a later redemption off the average, not the leftover FIFO lots', () => {
    const twoLots: Transaction[] = [
      buy('2025-01-01T10:00:00Z', 100, 10),
      buy('2025-02-01T10:00:00Z', 100, 20),
      sell('2025-03-01T10:00:00Z', 100, 30),
      sell('2025-04-01T10:00:00Z', 100, 30),
    ];

    const gains = getRealisedGainsBetween(twoLots, '2025-01-01', '2025-12-31', 'WEIGHTED_AVERAGE');

    // Both disposals cost the 15.00 average, not 10.00 then 20.00.
    expect(gains[0].acquisitionCost).toBeCloseTo(1500, 2);
    expect(gains[1].acquisitionCost).toBeCloseTo(1500, 2);
  });
});
