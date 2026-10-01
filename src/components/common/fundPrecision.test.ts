import { formatExactUnits, formatUnits, isRoundedUnits, roundUnits } from './fundPrecision';

describe('fund units shown as the fund rules state', () => {
  it.each([
    [894.61442, 894.614],
    [2.0005, 2.001],
    [1.0045, 1.005],
    [0.0025, 0.003],
    [-2.0005, -2.001],
    [18811874.09612, 18811874.096],
    [0.1 + 0.7, 0.8],
  ])('rounds %s half up on its decimal value to %s', (units, rounded) => {
    expect(roundUnits(units)).toBe(rounded);
  });

  it.each([
    [894.61442, '894.614'],
    [-1500.12345, '−1 500.123'],
    [-0.0004, '0.000'],
    [2000, '2 000.000'],
  ])('shows %s as %s', (units, shown) => {
    expect(formatUnits(units)).toBe(shown);
  });

  it.each([
    [894.61442, true],
    [-0.0004, true],
    [31.357, false],
    [2000, false],
    [0, false],
    [-0, false],
    [0.1 + 0.7, false],
  ])('knows whether %s had to be rounded: %s', (units, rounded) => {
    expect(isRoundedUnits(units)).toBe(rounded);
  });

  it.each([
    [894.61442, '894.61442'],
    [1.0004, '1.0004'],
    [-0.0004, '−0.0004'],
    [18811874.09612, '18 811 874.09612'],
  ])('shows the exact quantity of %s as the register holds it: %s', (units, exact) => {
    expect(formatExactUnits(units)).toBe(exact);
  });
});
