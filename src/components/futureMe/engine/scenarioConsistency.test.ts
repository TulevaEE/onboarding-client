import {
  CURRENT_YEAR,
  fundPensionTerm,
  PensionInput,
  retirementYears,
  Scenario,
  Sex,
  yearlyContribution,
} from './pension';
import {
  isWithin,
  keepGrowingScenario,
  lifeTable,
  rowAt,
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
  simulateWithoutIncomeTax,
  sustainableNeedWithoutIncomeTax,
  yearsCovered,
} from './testUtils';

type Persona = { label: string; input: PensionInput };

const scenarioCWithDeferral: Scenario = { ...scenarioC, deferral: 2 };
const scenarios: [string, Scenario][] = [
  ['A', scenarioA],
  ['B', scenarioB],
  ['C', scenarioCWithDeferral],
  ['D', scenarioD],
  ['E', keepGrowingScenario],
];

const savingsProfiles = [
  { p1Monthly: 650, p2: 9000, p3: 0, grossMonthly: 1000, p2Rate: 0.02, p3Monthly: 0 },
  { p1Monthly: 900, p2: 30000, p3: 20000, grossMonthly: 2000, p2Rate: 0.02, p3Monthly: 50 },
  { p1Monthly: 1150, p2: 90000, p3: 60000, grossMonthly: 4500, p2Rate: 0.06, p3Monthly: 500 },
];

const personas: Persona[] = [1956, 1961, 1966, 1971, 1978].flatMap((birthYear) =>
  (['N', 'M'] as Sex[]).flatMap((sex) =>
    [0, 0.02, 0.04].flatMap((realReturn) =>
      savingsProfiles.flatMap((profile) =>
        [790, 1200, 1800].map((needMonthly) => ({
          label: [birthYear, sex, realReturn, profile.p1Monthly, needMonthly].join('/'),
          input: {
            birthYear,
            sex,
            ...profile,
            p3Before2021: true,
            needMonthly,
            realReturn,
          },
        })),
      ),
    ),
  ),
);

const failingPersonas = (candidates: Persona[], holds: (input: PensionInput) => boolean) =>
  candidates.filter(({ input }) => !holds(input)).map(({ label }) => label);

const currentAge = (input: PensionInput) => CURRENT_YEAR - input.birthYear;

describe('pension scenarios without income tax, growing the savings until pension age', () => {
  const personasBeforePensionAge = personas.filter(
    ({ input }) => currentAge(input) < retirementYears(input),
  );
  const savingsAtPensionAge = (input: PensionInput) =>
    Array.from({ length: retirementYears(input) - currentAge(input) }).reduce<number>(
      (savings) => savings * (1 + input.realReturn) + yearlyContribution(input),
      input.p2 + input.p3,
    );
  const moneyLeftAtPensionAge = (input: PensionInput, scenario: Scenario) =>
    rowAt(simulateWithoutIncomeTax(input, lifeTable, scenario), retirementYears(input)).moneyLeft;

  it.each(scenarios.filter(([scenarioId]) => scenarioId !== 'A'))(
    'in scenario %s, grows the savings exactly once a year with contributions at year end',
    (_, scenario) => {
      expect(
        failingPersonas(personasBeforePensionAge, (input) =>
          isWithin(moneyLeftAtPensionAge(input, scenario), savingsAtPensionAge(input), 0.01),
        ),
      ).toEqual([]);
    },
  );

  it('in scenario A, leaves 90% of the savings after withdrawing everything at once', () => {
    expect(
      failingPersonas(personasBeforePensionAge, (input) =>
        isWithin(moneyLeftAtPensionAge(input, scenarioA), savingsAtPensionAge(input) * 0.9, 0.01),
      ),
    ).toEqual([]);
  });
});

describe.each(scenarios)(
  'pension scenario %s without income tax, at zero returns',
  (_, scenario) => {
    const personasAtZeroReturn = personas
      .filter(({ input }) => input.realReturn === 0)
      .map(({ label, input }) => ({ label, input: { ...input, depositReturn: 0 } }));

    it('changes the money left by the state pension minus spending, less a tax of at most a ninth of the withdrawal', () => {
      expect(
        failingPersonas(personasAtZeroReturn, (input) => {
          const simulation = simulateWithoutIncomeTax(input, lifeTable, scenario);
          const pensionAge = Math.max(retirementYears(input), currentAge(input));
          return simulation.rows
            .filter((row) => row.age >= pensionAge && row.age < 100)
            .every((row) => {
              const next = simulation.rows.find((candidate) => candidate.age === row.age + 1);
              if (!next) {
                return true;
              }
              const tax = row.moneyLeft + row.i1 * 12 - row.spend * 12 - next.moneyLeft;
              return tax >= -0.01 && tax <= (row.i23 * 12) / 9 + 0.01;
            });
        }),
      ).toEqual([]);
    });

    it('never has negative money left or a negative shortfall', () => {
      expect(
        failingPersonas(personasAtZeroReturn, (input) =>
          simulateWithoutIncomeTax(input, lifeTable, scenario).rows.every(
            (row) => row.moneyLeft >= -0.01 && row.shortfall >= -0.01,
          ),
        ),
      ).toEqual([]);
    });
  },
);

const improvements: [string, (input: PensionInput) => PensionInput][] = [
  ['10 000 € more in the II pillar', (input) => ({ ...input, p2: input.p2 + 10000 })],
  ['10 000 € more in the III pillar', (input) => ({ ...input, p3: input.p3 + 10000 })],
  ['a 100 € higher state pension', (input) => ({ ...input, p1Monthly: input.p1Monthly + 100 })],
  ['a 2% higher return', (input) => ({ ...input, realReturn: input.realReturn + 0.02 })],
  [
    'a 1000 € higher salary',
    (input) => ({ ...input, grossMonthly: (input.grossMonthly ?? 0) + 1000 }),
  ],
];

const sampledPersonas = personas.filter((_, index) => index % 4 === 0);

describe.each(scenarios)(
  'pension scenario %s without income tax, given a better input',
  (_, scenario) => {
    const yearsCoveredFor = (input: PensionInput) =>
      yearsCovered(simulateWithoutIncomeTax(input, lifeTable, scenario));
    const sustainableNeedFor = (input: PensionInput) =>
      sustainableNeedWithoutIncomeTax(input, lifeTable, scenario);

    it.each(improvements)('with %s, does not cover the need for a shorter time', (__, improve) => {
      expect(
        failingPersonas(
          sampledPersonas,
          (input) => yearsCoveredFor(improve(input)) >= yearsCoveredFor(input),
        ),
      ).toEqual([]);
    });

    it.each(improvements)('with %s, does not lower the sustainable need', (__, improve) => {
      expect(
        failingPersonas(
          sampledPersonas,
          (input) => sustainableNeedFor(improve(input)) >= sustainableNeedFor(input),
        ),
      ).toEqual([]);
    });

    it('with a 200 € higher need, does not cover the need for a longer time', () => {
      expect(
        failingPersonas(
          sampledPersonas,
          (input) =>
            yearsCoveredFor({ ...input, needMonthly: input.needMonthly + 200 }) <=
            yearsCoveredFor(input),
        ),
      ).toEqual([]);
    });
  },
);

describe('pension scenarios without income tax', () => {
  it('sustains at least as much spending when the savings keep growing as when withdrawn all at once', () => {
    expect(
      failingPersonas(
        sampledPersonas.filter(({ input }) => input.realReturn >= 0),
        (input) =>
          sustainableNeedWithoutIncomeTax(input, lifeTable, keepGrowingScenario) >=
          sustainableNeedWithoutIncomeTax(input, lifeTable, scenarioA),
      ),
    ).toEqual([]);
  });

  it('leaves a temporary gap before a deferred state pension when there is little money to bridge it', () => {
    const simulation = simulateWithoutIncomeTax(
      {
        birthYear: 1966,
        sex: 'N',
        p1Monthly: 1000,
        p2: 3000,
        p3: 0,
        p3Before2021: true,
        needMonthly: 800,
        realReturn: 0.02,
      },
      lifeTable,
      scenarioCWithDeferral,
    );

    expect(simulation.gapTemporary).toBe(true);
    expect(simulation.coversNeedUntil).toBeLessThan(simulation.p1StartAge);
    expect(simulation.gapEnd).toBe(simulation.p1StartAge - 1);
  });

  it('pays a single fund pension contract over the term at the current age when already past pension age', () => {
    const simulation = simulateWithoutIncomeTax(
      {
        birthYear: 1956,
        sex: 'N',
        p1Monthly: 3000,
        p2: 21000,
        p3: 0,
        p3Before2021: true,
        needMonthly: 0,
        realReturn: 0,
      },
      lifeTable,
      scenarioB,
    );

    expect(rowAt(simulation, 70).i23 * 12).toBeCloseTo(21000 / fundPensionTerm(lifeTable, 70), 2);
  });

  it('bridges a deferred state pension with a tax-free fund pension from pension age', () => {
    const simulation = simulateWithoutIncomeTax(
      {
        birthYear: 1966,
        sex: 'N',
        p1Monthly: 900,
        p2: 30000,
        p3: 0,
        p3Before2021: true,
        needMonthly: 0,
        realReturn: 0,
      },
      lifeTable,
      scenarioCWithDeferral,
    );

    expect(rowAt(simulation, 65).i23).toBeGreaterThan(0);
    expect(rowAt(simulation, 65).i1).toBe(0);
  });

  describe('a deposit after withdrawing everything at once', () => {
    const input: PensionInput = {
      birthYear: 1961,
      sex: 'N',
      p1Monthly: 0,
      p2: 10000,
      p3: 0,
      p3Before2021: true,
      needMonthly: 0,
      realReturn: 0,
    };

    it('loses 1% a year by default', () => {
      expect(
        rowAt(simulateWithoutIncomeTax(input, lifeTable, scenarioA), 66).moneyLeft,
      ).toBeCloseTo(9000 * 0.99, 2);
    });

    it('keeps its value at a 0% deposit return', () => {
      expect(
        rowAt(simulateWithoutIncomeTax({ ...input, depositReturn: 0 }, lifeTable, scenarioA), 66)
          .moneyLeft,
      ).toBeCloseTo(9000, 2);
    });
  });
});
