import {
  AASTAHINNE,
  AVG_OLD_AGE_PENSION,
  CHILD_II_MONTHLY,
  childSupplement,
  civilIncrease,
  decisionMap,
  DEFERRAL_INCREASE,
  EARLY_DECREASE,
  GENERAL_ALLOWANCE,
  INCOME_TAX,
  INFLATION,
  PENSIONER_ALLOWANCE,
  PensionInput,
  rescueIncrease,
  retirementYears,
  Scenario,
  SeparateThirdPillar,
  simulate,
  SimulationResult,
  SimulationRow,
  WAGE_GROWTH,
  SCENARIOS,
} from './pension';
import { keepGrowingScenario, lifeTable, scenarioB, scenarioD, within } from './testUtils';

const firstStatePensionRow = ({ rows }: SimulationResult): SimulationRow => {
  const row = rows.find(({ i1g }) => i1g > 0);
  if (!row) {
    throw new Error('No simulation row pays a state pension');
  }
  return row;
};

const serviceIncreaseThresholds = [
  [10, 0.1],
  [16, 0.2],
  [21, 0.25],
  [26, 0.4],
  [31, 0.5],
];

const base: PensionInput = {
  birthYear: 1976,
  sex: 'M',
  p1Monthly: 1200,
  p2: 50000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 1500,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};
describe('pension rules', () => {
  describe('constants', () => {
    it('tax income at 22%', () => {
      expect(INCOME_TAX).toBe(0.22);
    });

    it('leave a pensioner 776 € a month tax free', () => {
      expect(PENSIONER_ALLOWANCE).toBe(776 * 12);
    });

    it('leave everyone else 700 € a month tax free', () => {
      expect(GENERAL_ALLOWANCE).toBe(700 * 12);
    });

    it('value a pension year at 10.477 €', () => {
      expect(AASTAHINNE).toBe(10.477);
    });

    it('put the average old-age pension at 860.23 € a month', () => {
      expect(AVG_OLD_AGE_PENSION).toBe(860.23);
    });

    it('raise a deferred state pension by the published table', () => {
      expect(DEFERRAL_INCREASE).toEqual({
        0: 0,
        1: 0.0793,
        2: 0.1688,
        3: 0.2701,
        4: 0.385,
        5: 0.5157,
      });
    });

    it('lower a state pension taken early by the published table', () => {
      expect(EARLY_DECREASE).toEqual({
        0: 0,
        1: 0.0717,
        2: 0.1378,
        3: 0.1988,
        4: 0.255,
        5: 0.3067,
      });
    });

    it.each(serviceIncreaseThresholds)(
      'raise a civil servant pension from %i years of service by %f',
      (years, increase) => {
        expect(civilIncrease(years)).toBe(increase);
        expect(civilIncrease(years - 1)).toBeLessThan(increase);
      },
    );

    it.each(serviceIncreaseThresholds)(
      'raise a rescue service pension from %i years of service by %f',
      (years, increase) => {
        expect(rescueIncrease(years)).toBe(increase);
        expect(rescueIncrease(years - 1)).toBeLessThan(increase);
      },
    );

    it('pay the published monthly second pillar contribution for a child under 3', () => {
      expect(CHILD_II_MONTHLY).toEqual({ 2026: 76.12, 2027: 80.76 });
    });

    it('add 3.5 pension years for a child born before 2013', () => {
      expect(
        childSupplement({
          ...base,
          birthYear: 1960,
          p2: 0,
          p2Rate: 0,
          kids: { b1991: 1, user: 'me' },
        }),
      ).toBeCloseTo(3.5 * AASTAHINNE, within(1e-9));
    });

    it("assume Tuleva's wage growth and inflation", () => {
      expect({ wageGrowth: WAGE_GROWTH, inflation: INFLATION }).toEqual({
        wageGrowth: 0.03,
        inflation: 0.02,
      });
    });

    it('allow a deferral of at most 5 years', () => {
      expect(Math.max(...Object.keys(DEFERRAL_INCREASE).map(Number))).toBe(5);
    });
  });

  describe('engine', () => {
    it('taxes the state pension at 22% above the 776 € pensioner allowance', () => {
      const result = simulate(base, lifeTable, keepGrowingScenario);

      expect(firstStatePensionRow(result).tax1).toBeCloseTo(0.22 * (1200 - 776), within(1e-6));
    });

    it('does not tax a state pension below the pensioner allowance', () => {
      const result = simulate({ ...base, p1Monthly: 700 }, lifeTable, keepGrowingScenario);

      expect(firstStatePensionRow(result).tax1).toBe(0);
    });

    it('raises the state pension by 7.93% after one year of deferral', () => {
      const result = simulate(base, lifeTable, { ...keepGrowingScenario, deferral: 1 });

      expect(firstStatePensionRow(result).i1g).toBeCloseTo(1200 * (1 + 0.0793), within(1e-6));
    });

    it('opens third pillar preferential withdrawals at 55 for savers who joined before 2021', () => {
      const texts = decisionMap({ ...base, p3: 10000, p3Before2021: true }).map(({ text }) => text);

      expect(texts).toEqual(expect.arrayContaining([expect.stringContaining('Alates 55')]));
    });

    it('opens third pillar preferential withdrawals five years before the pension age for savers who joined in 2021 or later', () => {
      const texts = decisionMap({ ...base, p3: 10000, p3Before2021: false }).map(
        ({ text }) => text,
      );

      expect(texts).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`Alates ${retirementYears(base) - 5}, 5 aastat enne pensioniiga`),
        ]),
      );
    });

    it('opens the II and III pillar five years before a pension age of 68 for savers who joined in 2021 or later', () => {
      const decisions = decisionMap({
        ...base,
        p3: 10000,
        p3Before2021: false,
        pensionAgeYears: 68,
      });

      expect(decisions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ age: 63, title: 'III sammas soodusmaksuga' }),
          expect.objectContaining({ age: 63, title: 'II sammas ja paindlik riiklik pension' }),
        ]),
      );
    });

    it('describes the yearly contract as lasting longer, not as money that never runs out', () => {
      const yearlyTexts = [
        ...decisionMap(base).map(({ text }) => text),
        SCENARIOS.find(({ id }) => id === 'D')?.short,
      ].filter((text) => text?.includes('lepingu') && text.includes('igal aastal'));

      expect(yearlyTexts).toHaveLength(2);
      yearlyTexts.forEach((text) => {
        expect(text).not.toMatch(/saa otsa|kuumakse/i);
        expect(text).toMatch(/kauemaks/);
      });
    });

    it('puts the full state pension at the pension age the saver picked', () => {
      const decisions = decisionMap({ ...base, pensionAgeYears: 67 });

      expect(decisions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            age: 67,
            year: base.birthYear + 67,
            title: 'Riiklik pension täissummas (67 a)',
          }),
        ]),
      );
    });
  });

  describe('second and third pillar fund pension contracts', () => {
    const thirdPillarIncome = (contract: SeparateThirdPillar['contract'], scenario: Scenario) =>
      simulate(
        {
          ...base,
          needMonthly: 300,
          p2: 50000,
          p3Sep: { amount: 20000, mode: 'fund', contract },
        },
        lifeTable,
        scenario,
      ).rows.map(({ i3 }) => i3.toFixed(4));

    it.each(['once', 'yearly'])(
      'pay the same third pillar income with a %s third pillar contract whatever the second pillar contract',
      (contract) => {
        expect(thirdPillarIncome(contract, scenarioB)).toEqual(
          thirdPillarIncome(contract, scenarioD),
        );
      },
    );

    it('change the third pillar income with the third pillar contract', () => {
      expect(thirdPillarIncome('once', scenarioB)).not.toEqual(
        thirdPillarIncome('yearly', scenarioB),
      );
    });
  });
});
