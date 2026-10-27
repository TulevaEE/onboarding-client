import {
  CURRENT_YEAR,
  DEFERRAL_INCREASE,
  fundPensionTerm,
  PensionInput,
  retirementYears,
  Scenario,
  Sex,
  simulate,
  sustainableNeed,
} from './pension';
import {
  coversNeedUntilHorizon,
  isWithin,
  keepGrowingScenario,
  lifeTable,
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
  yearsCovered,
} from './testUtils';

type Case = { label: string; input: PensionInput };

const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const random = seededRandom(20261011);
const pick = <T>(values: T[]): T => values[Math.floor(random() * values.length)];

const randomInput = (): PensionInput => ({
  birthYear: pick([1961, 1964, 1966, 1971, 1976, 1981, 1986, 1991]),
  sex: pick<Sex>(['M', 'N']),
  p1Monthly: pick([0, 500, 776, 900, 1200, 1800]),
  p2: pick([0, 8000, 30000, 90000]),
  p3: pick([0, 6000, 25000]),
  p3Before2021: pick([true, false]),
  grossMonthly: pick([0, 0, 2000, 4000]),
  p2Rate: pick([0, 0.02, 0.06]),
  p3Monthly: pick([0, 0, 150]),
  needMonthly: pick([400, 791, 1200, 2000]),
  realReturn: pick([0, 0.02, 0.04, -0.01]),
  extraDeposit: pick([0, 0, 5000]),
});

const describeCase = (index: number, input: PensionInput) =>
  `#${index} ${input.birthYear}/${input.sex}/p1 ${input.p1Monthly}/p2 ${input.p2}/p3 ${input.p3}/r ${input.realReturn}/need ${input.needMonthly}`;

const cases: Case[] = Array.from({ length: 600 }, (_, index) => {
  const input = randomInput();
  return { label: describeCase(index, input), input };
});

const scenarios: [string, Scenario][] = [
  ['A', scenarioA],
  ['B', scenarioB],
  ['C', { ...scenarioC, deferral: 2 }],
  ['D', scenarioD],
  ['E', keepGrowingScenario],
  ['E3', { id: 'E', deferral: 3 }],
];

const failingCases = (candidates: Case[], holds: (input: PensionInput) => boolean) =>
  candidates.filter(({ input }) => !holds(input)).map(({ label }) => label);

const casesWithStatePension = cases.filter(({ input }) => input.p1Monthly > 0);
const casesWithoutStatePension = cases.filter(({ input }) => input.p1Monthly === 0);
const casesWithNonNegativeReturn = cases.filter(({ input }) => input.realReturn >= 0);
const everyFourthCase = cases.filter((_, index) => index % 4 === 0);
const everyFourthCaseBelowHighestReturn = everyFourthCase.filter(
  ({ input }) => input.realReturn < 0.04,
);

const memoized = <T>(compute: (input: PensionInput) => T) => {
  const results = new Map<PensionInput, T>();
  return (input: PensionInput): T => {
    if (!results.has(input)) {
      results.set(input, compute(input));
    }
    return results.get(input) as T;
  };
};

describe.each(scenarios)('pension engine in scenario %s, for any input', (scenarioId, scenario) => {
  const simulationOf = (input: PensionInput) => simulate(input, lifeTable, scenario);
  const sustainableNeedOf = (input: PensionInput) => sustainableNeed(input, lifeTable, scenario);
  const baseSustainableNeedOf = memoized(sustainableNeedOf);
  const isSingleContract = scenarioId === 'B';
  const sustainableNeedLimitCases = isSingleContract ? casesWithNonNegativeReturn : cases;
  const sustainableNeedLimitReturns = isSingleContract ? 'a non-negative return' : 'any return';
  const firstStatePensionRow = (input: PensionInput) =>
    simulationOf(input).rows.find((row) => row.i1g > 0);
  const statePensionStartAge = (input: PensionInput) =>
    retirementYears(input) + (scenario.deferral || 0);

  it('produces only finite numbers', () => {
    expect(
      failingCases(cases, (input) =>
        simulationOf(input).rows.every((row) =>
          Object.values(row).every((value) => typeof value !== 'number' || Number.isFinite(value)),
        ),
      ),
    ).toEqual([]);
  });

  it('never produces a negative income, shortfall or balance', () => {
    expect(
      failingCases(cases, (input) =>
        simulationOf(input).rows.every(
          (row) =>
            row.i1 >= -1e-9 &&
            row.i2 >= -1e-9 &&
            row.i3 >= -1e-9 &&
            row.dep >= -1e-9 &&
            row.shortfall >= -1e-9 &&
            row.moneyLeft >= -1e-6,
        ),
      ),
    ).toEqual([]);
  });

  it('spends at most the need from pension age, with the shortfall making up the rest', () => {
    expect(
      failingCases(cases, (input) => {
        const need = input.needMonthly;
        const pensionAge = retirementYears(input);
        return simulationOf(input)
          .rows.filter((row) => row.age >= pensionAge)
          .every(
            (row) =>
              (row.spend <= need + 1e-6 && isWithin(row.spend + row.shortfall, need, 1e-6)) ||
              (row.spend >= need - 1e-6 && row.shortfall === 0),
          );
      }),
    ).toEqual([]);
  });

  it('taxes the state pension at 22% of the part above 776 € a month', () => {
    expect(
      failingCases(cases, (input) =>
        simulationOf(input).rows.every((row) =>
          isWithin(row.tax1, 0.22 * Math.max(0, row.i1g - 776), 1e-6),
        ),
      ),
    ).toEqual([]);
  });

  it('pays the state pension net of income tax and never above the gross amount', () => {
    expect(
      failingCases(cases, (input) =>
        simulationOf(input).rows.every(
          (row) => isWithin(row.i1, row.i1g - row.tax1, 1e-6) && row.i1 <= row.i1g + 1e-9,
        ),
      ),
    ).toEqual([]);
  });

  it('starts the state pension at pension age plus the deferral', () => {
    expect(
      failingCases(casesWithStatePension, (input) => {
        const first = firstStatePensionRow(input);
        return (
          first !== undefined &&
          first.age === Math.max(statePensionStartAge(input), simulationOf(input).rows[0].age)
        );
      }),
    ).toEqual([]);
  });

  it('raises the state pension by the deferral increase', () => {
    expect(
      failingCases(casesWithStatePension, (input) => {
        const first = firstStatePensionRow(input);
        return (
          first !== undefined &&
          isWithin(
            first.i1g,
            input.p1Monthly * (1 + DEFERRAL_INCREASE[scenario.deferral || 0]),
            1e-6,
          )
        );
      }),
    ).toEqual([]);
  });

  it('pays no state pension when none is earned', () => {
    expect(
      failingCases(casesWithoutStatePension, (input) => firstStatePensionRow(input) === undefined),
    ).toEqual([]);
  });

  it(`covers the sustainable need until the horizon, at ${sustainableNeedLimitReturns}`, () => {
    expect(
      failingCases(sustainableNeedLimitCases, (input) => {
        const limit = baseSustainableNeedOf(input);
        return limit === 0 || coversNeedUntilHorizon(simulate(input, lifeTable, scenario, limit));
      }),
    ).toEqual([]);
  });

  it(`stops covering until the horizon 20 € a month above the sustainable need, at ${sustainableNeedLimitReturns}`, () => {
    expect(
      failingCases(sustainableNeedLimitCases, (input) => {
        const limit = baseSustainableNeedOf(input);
        return (
          limit >= 9990 || !coversNeedUntilHorizon(simulate(input, lifeTable, scenario, limit + 20))
        );
      }),
    ).toEqual([]);
  });

  it('does not lower the sustainable need with 10 000 € more in the II pillar', () => {
    expect(
      failingCases(
        everyFourthCase,
        (input) =>
          sustainableNeedOf({ ...input, p2: input.p2 + 10000 }) >=
          baseSustainableNeedOf(input) - 10,
      ),
    ).toEqual([]);
  });

  it('does not lower the sustainable need with a 100 € higher state pension', () => {
    expect(
      failingCases(
        everyFourthCase,
        (input) =>
          sustainableNeedOf({ ...input, p1Monthly: input.p1Monthly + 100 }) >=
          baseSustainableNeedOf(input) - 10,
      ),
    ).toEqual([]);
  });

  it('does not lower the sustainable need with a 2% higher return', () => {
    expect(
      failingCases(
        everyFourthCaseBelowHighestReturn,
        (input) =>
          sustainableNeedOf({ ...input, realReturn: input.realReturn + 0.02 }) >=
          baseSustainableNeedOf(input) - 10,
      ),
    ).toEqual([]);
  });

  it('does not cover a 100 € smaller need for a shorter time', () => {
    expect(
      failingCases(
        cases,
        (input) =>
          yearsCovered(simulate(input, lifeTable, scenario, input.needMonthly - 100)) >=
          yearsCovered(simulate(input, lifeTable, scenario, input.needMonthly)),
      ),
    ).toEqual([]);
  });
});

describe('pension engine cash flows at zero returns', () => {
  it.each([
    ['D', scenarioD],
    ['E', keepGrowingScenario],
  ])(
    'in scenario %s, changes the money left by the state pension minus spending, less a withdrawal tax of at most 10% of the assets',
    (_, scenario) => {
      expect(
        failingCases(cases, (input) => {
          const pensionAge = retirementYears(input);
          const fromPensionAge = simulate(
            { ...input, realReturn: 0, depositReturn: 0 },
            lifeTable,
            scenario,
          ).rows.filter((row) => row.age >= pensionAge);
          return fromPensionAge.slice(0, -1).every((row, index) => {
            const next = fromPensionAge[index + 1];
            const withdrawalTax = row.moneyLeft - next.moneyLeft - 12 * (row.spend - row.i1);
            return withdrawalTax >= -1e-6 && withdrawalTax <= 0.1 * row.moneyLeft + 1e-6;
          });
        }),
      ).toEqual([]);
    },
  );
});

describe('pension engine without income tax', () => {
  it('pays the full state pension with no tax', () => {
    expect(
      failingCases(cases.slice(0, 80), (input) =>
        simulate({ ...input, incomeTax: false }, lifeTable, keepGrowingScenario).rows.every(
          (row) => row.tax1 === 0 && isWithin(row.i1, row.i1g, 1e-6),
        ),
      ),
    ).toEqual([]);
  });
});

describe('pension engine single fund pension contract', () => {
  const contractCases = cases
    .slice(0, 120)
    .map(({ label, input }) => ({ label, input: { ...input, needMonthly: 1, extraDeposit: 0 } }));
  const contractStartAge = (input: PensionInput) =>
    Math.max(retirementYears(input), CURRENT_YEAR - input.birthYear);
  const contractTerm = (input: PensionInput) =>
    fundPensionTerm(lifeTable, input.sex, contractStartAge(input));

  it('pays a monthly amount that follows the fund value over the contract term', () => {
    expect(
      failingCases(contractCases, (input) => {
        const start = contractStartAge(input);
        const end = start + contractTerm(input);
        const payments = simulate(input, lifeTable, scenarioB)
          .rows.filter((row) => row.age >= start && row.age < end)
          .map((row) => row.i2);
        return (
          payments.length > 0 &&
          payments.every((payment, year) =>
            isWithin(payment, payments[0] * (1 + input.realReturn) ** year, 1e-6),
          )
        );
      }),
    ).toEqual([]);
  });

  it('pays nothing after the contract term', () => {
    expect(
      failingCases(contractCases, (input) => {
        const end = contractStartAge(input) + contractTerm(input);
        const afterTerm = simulate(input, lifeTable, scenarioB).rows.find((row) => row.age === end);
        return afterTerm === undefined || afterTerm.i2 === 0;
      }),
    ).toEqual([]);
  });
});

describe('pension engine yearly renewed fund pension contract', () => {
  const casesBeforePensionAge = cases
    .slice(0, 120)
    .filter(({ input }) => CURRENT_YEAR - input.birthYear <= 63);

  it('grows from pension age to the next year by at most the fund return and does not drop below 90%', () => {
    expect(
      failingCases(casesBeforePensionAge, (input) => {
        const pensionAge = retirementYears(input);
        const { rows } = simulate({ ...input, needMonthly: 1, p1Monthly: 0 }, lifeTable, scenarioD);
        const atPensionAge = rows.find((row) => row.age === pensionAge);
        const nextYear = rows.find((row) => row.age === pensionAge + 1);
        if (!atPensionAge || !nextYear || atPensionAge.i2 <= 1) {
          return true;
        }
        return (
          nextYear.i2 <= atPensionAge.i2 * (1 + input.realReturn) * 1.001 + 1e-9 &&
          nextYear.i2 >= atPensionAge.i2 * 0.9
        );
      }),
    ).toEqual([]);
  });
});
