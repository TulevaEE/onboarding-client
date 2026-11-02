import { PensionInput, simulate, SimulationResult } from './pension';
import { lifeTable, rowAt, scenarioB } from './testUtils';

const calculatorInputs: PensionInput = {
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

const earlierCalculatorInputs: PensionInput = {
  birthYear: 1990,
  sex: 'X',
  p1Monthly: 865,
  p2: 33825,
  p3: 47973,
  grossMonthly: 4000,
  p2Rate: 0.06,
  p3Monthly: 0,
  needMonthly: 1500,
  realReturn: 0,
  depositReturn: -0.01,
  extraDeposit: 0,
};

const statePensionStartOf = (result: SimulationResult) => rowAt(result, result.p1StartAge);
const pensionStartOf = (result: SimulationResult) => rowAt(result, result.pensionStartAge);

const expectWithin = (actual: number, expected: number, tolerance: number) => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

type CalculatorCase = {
  name: string;
  change: Partial<PensionInput>;
  calculator: { firstPillar: number; secondPillar: number; thirdPillar: number };
};

describe('Social Insurance Board pension calculator', () => {
  describe.each<CalculatorCase>([
    {
      name: 'II pillar at 6% and no III pillar contributions',
      change: {},
      calculator: { firstPillar: 865, secondPillar: 757, thirdPillar: 206 },
    },
    {
      name: 'II pillar at 2%',
      change: { p2Rate: 0.02 },
      calculator: { firstPillar: 865, secondPillar: 513, thirdPillar: 206 },
    },
    {
      name: 'II pillar at 4%',
      change: { p2Rate: 0.04 },
      calculator: { firstPillar: 865, secondPillar: 635, thirdPillar: 206 },
    },
    {
      name: 'III pillar contributions of 450 € a month',
      change: { p3Monthly: 450 },
      calculator: { firstPillar: 865, secondPillar: 757, thirdPillar: 893 },
    },
  ])('with $name', ({ change, calculator }) => {
    const result = simulate({ ...calculatorInputs, ...change }, lifeTable, scenarioB);
    const atPension = pensionStartOf(result);

    it('retires in 2056 like the calculator', () => {
      expect(atPension.year).toBe(2056);
    });

    it('matches the state pension within 1 €', () => {
      expectWithin(statePensionStartOf(result).i1g, calculator.firstPillar, 1);
    });

    it('matches the II pillar payment within 1.5%', () => {
      expectWithin(atPension.i2, calculator.secondPillar, 0.015 * calculator.secondPillar);
    });

    it('matches the III pillar payment within 1.5%', () => {
      expectWithin(atPension.i3, calculator.thirdPillar, 0.015 * calculator.thirdPillar);
    });
  });

  describe('flexible pension', () => {
    it('matches the state pension 3 years later while working on, within 1 €', () => {
      const result = simulate({ ...calculatorInputs, workOn: true, workUntil: 69 }, lifeTable, {
        id: 'C',
        deferral: 3,
        contract: 'yearly',
      });
      expectWithin(statePensionStartOf(result).i1g, 1145, 1);
    });

    it('matches the state pension 3 years later while working on from a pension age of 66, within 1 €', () => {
      const result = simulate(
        { ...earlierCalculatorInputs, pensionAgeYears: 66, workOn: true, workUntil: 69 },
        lifeTable,
        { id: 'C', deferral: 3, contract: 'yearly' },
      );
      expectWithin(rowAt(result, 69).i1g, 1145, 1);
    });

    describe('3 years early', () => {
      const result = simulate(
        { ...calculatorInputs, soodus: 3, flexEarly: 3 },
        lifeTable,
        scenarioB,
      );

      it('starts the state pension at 63', () => {
        expect(result.p1StartAge).toBe(63);
      });

      it('matches the state pension reduced for life within 1 €', () => {
        expectWithin(statePensionStartOf(result).i1g, 664, 1);
      });
    });
  });

  describe('children', () => {
    it.each([
      { children: 3, calculator: 853 },
      { children: 4, calculator: 829 },
      { children: 5, calculator: 805 },
    ])(
      'matches the state pension when retiring early for $children children, with the supplement left to the other parent, within 1.5 €, one working year less for each year early',
      ({ children, calculator }) => {
        const result = simulate(
          { ...earlierCalculatorInputs, kids: { b2012: children, user: 'me', supUser: 'other' } },
          lifeTable,
          scenarioB,
        );
        expectWithin(pensionStartOf(result).i1g, calculator, 1.5);
      },
    );

    it('matches the state pension with the supplement for 2 children within 1 €', () => {
      const result = simulate(
        { ...earlierCalculatorInputs, kids: { b2012: 2, user: 'me' } },
        lifeTable,
        scenarioB,
      );
      expectWithin(pensionStartOf(result).i1g, 939, 1);
    });
  });
});
