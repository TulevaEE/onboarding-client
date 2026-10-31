import {
  childSupplement,
  DEFERRAL_INCREASE,
  earlyYears,
  options,
  KidsInput,
  PensionInput,
  rescueIncrease,
  retirementYears,
  simulate,
  SimulationResult,
  workAccrual,
} from './pension';
import { lifeTable, rowAt, scenarioB } from './testUtils';

const base: PensionInput = {
  birthYear: 1990,
  sex: 'N',
  p1Monthly: 865,
  p2: 33824.99,
  p3: 0,
  grossMonthly: 4000,
  p2Rate: 0.06,
  p3Monthly: 0,
  needMonthly: 1500,
  realReturn: 0,
  depositReturn: 0,
  firstYearShare: 3 / 12,
  p3Sep: { amount: 47484.86, mode: 'fund', contract: 'once' },
};

const simulateOneContract = (input: PensionInput) => simulate(input, lifeTable, scenarioB);

const statePensionAtStart = (result: SimulationResult) => rowAt(result, result.p1StartAge).i1g;
const statePensionAt = (result: SimulationResult, age: number) => rowAt(result, age).i1g;

describe('rescue service', () => {
  describe('pension increase', () => {
    it('raises the state pension by 20% after 20 years when retiring by 2042', () => {
      const retiringBy2042: PensionInput = { ...base, birthYear: 1975, soodus: 0 };
      expect(
        statePensionAtStart(simulateOneContract({ ...retiringBy2042, rescueYears: 20 })) /
          statePensionAtStart(simulateOneContract(retiringBy2042)),
      ).toBeCloseTo(1.2, 9);
    });

    it('is not paid when retiring after February 2043', () => {
      expect(
        Math.abs(
          statePensionAtStart(simulateOneContract({ ...base, soodus: 0, rescueYears: 20 })) - 865,
        ),
      ).toBeLessThanOrEqual(1);
    });

    it.each([
      { years: 9, increase: 0 },
      { years: 30, increase: 0.4 },
      { years: 31, increase: 0.5 },
    ])('is $increase after $years years', ({ years, increase }) => {
      expect(rescueIncrease(years)).toBe(increase);
    });
  });

  describe('allowance while waiting for the pension', () => {
    it('starts 5 years before the pension age after 15 years of service', () => {
      const result = simulateOneContract({ ...base, rescueYears: 15 });
      expect(result.p1StartAge).toBe(result.ordinaryPensionAge - 5);
    });

    it('is not paid after 14 years of service', () => {
      expect(earlyYears({ rescueYears: 14 })).toBe(0);
    });

    describe('with early retirement for children', () => {
      const kids: KidsInput = { b2012: 4, earlyUser: 'me', supUser: 'me' };
      const family: PensionInput = { ...base, birthYear: 1975, rescueYears: 20, kids };
      const ordinaryAge = retirementYears(family);
      const supplement = childSupplement(family);
      const mixed = simulateOneContract(family);
      const allowanceOnly = simulateOneContract({ ...family, rescueBasis: 'toetus' });
      const pensionOnly = simulateOneContract({ ...family, rescueBasis: 'pension' });

      it('starts the allowance 5 years early by default', () => {
        expect(mixed.pensionStartAge).toBe(ordinaryAge - 5);
      });

      it('pays the allowance until the pension for children starts by default', () => {
        expect([mixed.rescueAllowance?.from, mixed.rescueAllowance?.until]).toEqual([
          ordinaryAge - 5,
          ordinaryAge - 3,
        ]);
      });

      it('adds the children supplement, with the rescue increase, only once the pension for children starts', () => {
        expect(
          statePensionAt(mixed, ordinaryAge - 3) - statePensionAt(mixed, ordinaryAge - 4),
        ).toBeCloseTo(supplement * 1.2, 6);
      });

      it('pays the allowance until the pension for children starts in the year the birth dates give', () => {
        const dated = simulateOneContract({ ...family, kids: { ...kids, yearsEarly: 1 } });
        expect(dated.rescueAllowance?.until).toBe(ordinaryAge - 1);
      });

      it('pays the allowance until the pension age when only the allowance is chosen', () => {
        expect(allowanceOnly.rescueAllowance?.until).toBe(ordinaryAge);
      });

      it('pays the allowance without the children supplement until the pension age when only the allowance is chosen', () => {
        expect(statePensionAt(allowanceOnly, ordinaryAge - 1)).toBeCloseTo(
          statePensionAt(mixed, ordinaryAge - 4),
          6,
        );
      });

      it('adds the children supplement at the pension age when only the allowance is chosen', () => {
        expect(statePensionAt(allowanceOnly, ordinaryAge)).toBeCloseTo(
          statePensionAt(mixed, ordinaryAge),
          6,
        );
      });

      it('retires only 3 years early for the children when only the pension is chosen', () => {
        expect(pensionOnly.pensionStartAge).toBe(ordinaryAge - 3);
      });

      it('pays no allowance when only the pension is chosen', () => {
        expect(pensionOnly.rescueAllowance).toBeNull();
      });

      it('pays a larger pension for 2 more working years when only the pension is chosen', () => {
        expect(
          statePensionAt(pensionOnly, ordinaryAge - 3) - statePensionAt(mixed, ordinaryAge - 3),
        ).toBeCloseTo(2 * workAccrual(4000, true, true) * 1.2, 6);
      });

      it('pays the allowance until the pension age when the other parent uses the children right', () => {
        const otherParent = simulateOneContract({
          ...family,
          kids: { ...kids, earlyUser: 'other' },
        });
        expect(otherParent.rescueAllowance?.until).toBe(ordinaryAge);
      });
    });
  });
});

describe('rescue service allowance until the pension age, then the old-age pension', () => {
  const rescuer: PensionInput = { ...base, birthYear: 1975, rescueYears: 20 };
  const pensionAge = retirementYears(rescuer);
  const deferredBy = (years: number) =>
    simulate(rescuer, lifeTable, { ...scenarioB, deferral: years });
  const takenAtPensionAge = deferredBy(0);
  const deferredOneYear = deferredBy(1);

  it('lets the saver defer the old-age pension, because the allowance is not a pension', () => {
    expect(options(rescuer).deferral.open).toBe(true);
  });

  it('keeps paying the allowance until the pension age', () => {
    expect(statePensionAt(deferredOneYear, pensionAge - 1)).toBeCloseTo(
      statePensionAt(takenAtPensionAge, pensionAge - 1),
      6,
    );
  });

  it('pays no state pension in the deferred year after the allowance ends', () => {
    expect(statePensionAt(deferredOneYear, pensionAge)).toBe(0);
  });

  it('raises the old-age pension for the deferred year', () => {
    expect(statePensionAt(deferredOneYear, pensionAge + 1)).toBeCloseTo(
      statePensionAt(takenAtPensionAge, pensionAge + 1) * (1 + DEFERRAL_INCREASE[1]),
      6,
    );
  });

  it('pays half the old-age pension from the pension age when half is taken', () => {
    const half = simulate(rescuer, lifeTable, { ...scenarioB, half: 1 });
    expect(statePensionAt(half, pensionAge - 1)).toBeCloseTo(
      statePensionAt(takenAtPensionAge, pensionAge - 1),
      6,
    );
    expect(statePensionAt(half, pensionAge)).toBeCloseTo(
      statePensionAt(takenAtPensionAge, pensionAge) / 2,
      6,
    );
  });

  it('does not let the saver defer once the pension for children starts before the pension age', () => {
    const kids: KidsInput = { b2012: 4, earlyUser: 'me', supUser: 'me' };
    expect(options({ ...rescuer, kids }).deferral.open).toBe(false);
  });
});

describe('civil service pension increase', () => {
  it('raises the state pension by 20% after 20 years of service before 2013', () => {
    expect(
      statePensionAtStart(simulateOneContract({ ...base, soodus: 0, civilYears: 20 })) /
        statePensionAtStart(simulateOneContract({ ...base, soodus: 0 })),
    ).toBeCloseTo(1.2, 9);
  });

  it('does not add up with the rescue service increase, which alone applies', () => {
    const retiringBy2042: PensionInput = { ...base, birthYear: 1975, soodus: 0 };
    expect(
      statePensionAtStart(
        simulateOneContract({ ...retiringBy2042, civilYears: 30, rescueYears: 12 }),
      ) / statePensionAtStart(simulateOneContract(retiringBy2042)),
    ).toBeCloseTo(1.1, 9);
  });
});
