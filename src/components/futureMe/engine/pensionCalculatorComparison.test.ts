import {
  CURRENT_YEAR,
  INFLATION,
  p3Factor,
  PensionInput,
  WAGE_GROWTH,
  wageFactor,
  yearlyContribution,
} from './pension';
import { within } from './testUtils';

const base: PensionInput = {
  birthYear: CURRENT_YEAR - 35,
  sex: 'X',
  p1Monthly: 0,
  needMonthly: 0,
  pensionAgeYears: 65,
  p2: 33825,
  p3: 47973,
  grossMonthly: 4000,
  p2Rate: 0.06,
  p3Monthly: 0,
  realReturn: 0,
};
const tulevaAssumptions: Pick<PensionInput, 'wageGrowth' | 'inflation' | 'p3Indexed'> = {
  wageGrowth: WAGE_GROWTH,
  inflation: INFLATION,
  p3Indexed: false,
};

const savingAges = Array.from({ length: 65 - 35 }, (_, index) => 35 + index);

const potAtPensionAge = (input: PensionInput) =>
  savingAges.reduce(
    (pot, age) => pot * (1 + input.realReturn) + yearlyContribution(input, age),
    input.p2 + input.p3,
  );

describe("Tuleva's pension calculator comparison", () => {
  it.each<[string, Partial<PensionInput>, number]>([
    ['without third pillar payments', {}, 246499],
    ['with 450 € a month into the third pillar', { p3Monthly: 450 }, 368544],
    ['with only the third pillar at 450 € a month', { p3Monthly: 450, p2: 0, p2Rate: 0 }, 170019],
  ])(
    'saves the same pot by the pension age as the calculator %s, within 0.2%',
    (_, savings, calculatorPot) => {
      const pot = potAtPensionAge({ ...base, ...savings, ...tulevaAssumptions });

      expect(pot / calculatorPot).toBeCloseTo(1, within(0.002));
    },
  );

  it("assumes Tuleva's 3% wage growth and 2% inflation", () => {
    expect({ wageGrowth: WAGE_GROWTH, inflation: INFLATION }).toEqual({
      wageGrowth: 0.03,
      inflation: 0.02,
    });
  });

  it('keeps wages flat without wage growth and inflation in the input', () => {
    expect(wageFactor({ birthYear: 1990 }, 60)).toBe(1);
  });

  it("keeps third pillar payments flat in today's money without the assumptions in the input", () => {
    expect(p3Factor({ birthYear: 1990 }, 60)).toBe(1);
  });

  it("grows wages by Tuleva's wage growth in today's money at the middle of the year", () => {
    expect(wageFactor({ birthYear: 1990, ...tulevaAssumptions }, 37)).toBeCloseTo(
      1.03 / 1.02 ** 1.5,
      within(1e-12),
    );
  });

  it("shrinks fixed third pillar payments by inflation in today's money at the middle of the year", () => {
    expect(p3Factor({ birthYear: 1990, ...tulevaAssumptions }, 37)).toBeCloseTo(
      1 / 1.02 ** 1.5,
      within(1e-12),
    );
  });
});
