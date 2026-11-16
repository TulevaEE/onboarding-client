import { compareFirstPillarWithSecond, PENSION_UNIT_VALUE } from './firstPillarComparison';

describe('compareFirstPillarWithSecond, with the numbers of the rejoin landing page', () => {
  test('weighs a year of the 2000 € example at 6%: 2.04 € a month of I pillar pension, or 1276.80 € from your taxes into the II pillar', () => {
    const comparison = compareFirstPillarWithSecond(2000, 6);

    expect(comparison.firstPillarMonthly).toBeCloseTo(2.0352, 4);
    expect(comparison.secondPillarYearly).toBeCloseTo(1276.8, 6);
  });

  test('shows its working: 0.194 of a pension unit lost a year at a point value of 10.477 €, 960 € of the 1276.80 € from social tax, and 464 € of I pillar pension over 19 years in retirement', () => {
    const comparison = compareFirstPillarWithSecond(2000, 6);

    expect(comparison.firstPillarUnitsLost).toBeCloseTo(0.19425, 5);
    expect(comparison.firstPillarMonthly).toBeCloseTo(
      comparison.firstPillarUnitsLost * PENSION_UNIT_VALUE,
      10,
    );
    expect(comparison.socialTaxYearly).toBeCloseTo(960, 6);
    expect(comparison.firstPillarOverRetirement).toBeCloseTo(19 * 12 * 2.0352, 1);
  });

  test.each([500, 946, 1000, 2000, 10000])(
    'puts more into the II pillar in a year than the I pillar would pay for it over the 19 years an average retiree lives, at a salary of %d €',
    (grossSalary) => {
      const comparison = compareFirstPillarWithSecond(grossSalary, 2);

      expect(comparison.secondPillarYearly).toBeGreaterThan(comparison.firstPillarOverRetirement);
    },
  );

  test('counts a year of social tax and of income tax saved on the contribution, which is smaller at a smaller contribution', () => {
    expect(compareFirstPillarWithSecond(2000, 2).secondPillarYearly).toBeCloseTo(
      12 * (80 + 8.8),
      6,
    );
    expect(compareFirstPillarWithSecond(2000, 4).secondPillarYearly).toBeCloseTo(
      12 * (80 + 17.6),
      6,
    );
  });

  test('takes the same from the I pillar whatever the contribution, as only the 4% from social tax moves', () => {
    expect(compareFirstPillarWithSecond(2000, 2).firstPillarMonthly).toBeCloseTo(
      compareFirstPillarWithSecond(2000, 6).firstPillarMonthly,
      10,
    );
  });

  test('takes less from the I pillar per euro of salary as the salary grows, because half of a year in the I pillar is the same for everyone', () => {
    expect(compareFirstPillarWithSecond(1000, 6).firstPillarMonthly).toBeCloseTo(1.5414, 4);
    expect(compareFirstPillarWithSecond(5000, 6).firstPillarMonthly).toBeCloseTo(3.5164, 4);
  });

  test('shrinks the equal half below the minimum wage of 946 €, in proportion to the salary', () => {
    expect(compareFirstPillarWithSecond(946, 6).firstPillarMonthly).toBeCloseTo(1.5148, 4);
    expect(compareFirstPillarWithSecond(500, 6).firstPillarMonthly).toBeCloseTo(0.8006, 4);
  });

  test('leaves out the income tax a salary under the basic exemption does not pay', () => {
    expect(compareFirstPillarWithSecond(500, 6).secondPillarYearly).toBeCloseTo(12 * 20, 6);
  });
});
