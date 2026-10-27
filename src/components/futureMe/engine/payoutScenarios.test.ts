import {
  fundPensionTerm,
  PensionInput,
  Scenario,
  SCENARIOS,
  SeparateThirdPillar,
  SimulationResult,
  SimulationRow,
  yearlyContribution,
} from './pension';
import {
  coversNeedUntilHorizon,
  keepGrowingScenario,
  lifeTable,
  rowAt,
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
  simulateWithoutIncomeTax,
  sustainableNeedWithoutIncomeTax,
  within,
} from './testUtils';

const findRow = (
  { rows }: SimulationResult,
  matches: (row: SimulationRow) => boolean,
): SimulationRow => {
  const row = rows.find(matches);
  if (!row) {
    throw new Error('No simulation row matches');
  }
  return row;
};

const simulateFor = (input: PensionInput, scenario: Scenario, needOverride?: number) =>
  simulateWithoutIncomeTax(input, lifeTable, scenario, needOverride);

const base: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 900,
  p2: 30000,
  p3: 20000,
  p3Before2021: true,
  needMonthly: 1200,
  realReturn: 0.02,
};
const bridgeWithTwoYearDeferral: Scenario = { ...scenarioC, deferral: 2 };
const scenariosWithBridgeDeferred = SCENARIOS.map((scenario) =>
  scenario.id === 'C' ? bridgeWithTwoYearDeferral : scenario,
);
describe('payout scenarios', () => {
  describe('state pension deferred by two years in the bridge scenario', () => {
    const result = simulateFor(base, bridgeWithTwoYearDeferral);

    it('pays no state pension before the deferral ends', () => {
      expect(rowAt(result, 65).i1).toBe(0);
    });

    it('pays a state pension 16.88% higher once it starts', () => {
      expect(rowAt(result, 70).i1).toBeCloseTo(900 * 1.1688, within(0.01));
    });
  });

  describe('state pension deferred by two years when everything is withdrawn at once', () => {
    const result = simulateFor(base, { ...scenarioA, deferral: 2 });

    it('pays no state pension before the deferral ends', () => {
      expect(rowAt(result, 66).i1).toBe(0);
    });

    it('pays a state pension 16.88% higher once it starts', () => {
      expect(rowAt(result, 70).i1).toBeCloseTo(900 * 1.1688, within(0.01));
    });
  });

  describe('with a small need', () => {
    const small: PensionInput = { ...base, needMonthly: 900 };

    it.each(['M', 'N', 'X'] as const)(
      'ends the single contract payments at 84, after a 19 year term, for sex %s',
      (sex) => {
        const result = simulateFor({ ...small, sex }, scenarioB);

        expect(rowAt(result, 83).i23).toBeGreaterThan(0);
        expect(rowAt(result, 84).i23).toBe(0);
      },
    );

    it('keeps paying at 100 when the contract is renewed every year', () => {
      expect(rowAt(simulateFor(small, scenarioD), 100).i23).toBeGreaterThan(0);
    });
  });

  it.each(scenariosWithBridgeDeferred)(
    'never spends more than the need or less than nothing in scenario $id',
    (scenario) => {
      const { rows } = simulateFor(base, scenario);

      expect(
        rows
          .filter(({ spend }) => spend > base.needMonthly + 0.01 || spend < 0)
          .map(({ age, spend }) => ({ age, spend })),
      ).toEqual([]);
    },
  );

  describe.each([scenarioB, scenarioD])('sustainable need in scenario $id', (scenario) => {
    it('covers the need until the horizon', () => {
      const sustainable = sustainableNeedWithoutIncomeTax(base, lifeTable, scenario);

      expect(coversNeedUntilHorizon(simulateFor(base, scenario, sustainable))).toBe(true);
    });

    it('stops covering the need before the horizon with 50 € more a month', () => {
      const sustainable = sustainableNeedWithoutIncomeTax(base, lifeTable, scenario);

      expect(coversNeedUntilHorizon(simulateFor(base, scenario, sustainable + 50))).toBe(false);
    });
  });

  describe('contributions', () => {
    it('match a second pillar payment with 4% from the state and add the third pillar monthly payment', () => {
      expect(
        yearlyContribution({ ...base, grossMonthly: 2000, p2Rate: 0.04, p3Monthly: 100 }),
      ).toBe(2000 * 12 * 0.08 + 1200);
    });

    it('are zero without a second pillar rate or a third pillar payment', () => {
      expect(yearlyContribution({ ...base, grossMonthly: 2000, p2Rate: 0, p3Monthly: 0 })).toBe(0);
    });

    it('raise the expected lifetime spending', () => {
      const withContributions = simulateFor(
        { ...base, birthYear: 1970, grossMonthly: 2500, p2Rate: 0.02, p3Monthly: 100 },
        scenarioB,
      );
      const withoutContributions = simulateFor({ ...base, birthYear: 1970 }, scenarioB);

      expect(withContributions.expectedLifetime).toBeGreaterThan(
        withoutContributions.expectedLifetime,
      );
    });
  });

  it('starts the state pension at the chosen pension age', () => {
    expect(rowAt(simulateFor({ ...base, pensionAgeYears: 66 }, scenarioB), 65).i1).toBe(0);
  });

  describe.each([scenarioA, scenarioB, bridgeWithTwoYearDeferral, scenarioD])(
    'a deposit put aside earlier in scenario $id',
    (scenario) => {
      const withoutDeposit = simulateFor(base, scenario);
      const withDeposit = simulateFor({ ...base, extraDeposit: 10000 }, scenario);

      it('adds to the money at the start', () => {
        expect(withDeposit.rows[0].moneyLeft - withoutDeposit.rows[0].moneyLeft).toBeCloseTo(
          10000,
          within(0.01),
        );
      });

      it('does not lower the expected lifetime spending', () => {
        expect(withDeposit.expectedLifetime).toBeGreaterThanOrEqual(
          withoutDeposit.expectedLifetime,
        );
      });
    },
  );

  describe('separate third pillar', () => {
    it('gives the same expected lifetime spending as a joint pot when paid out the same way', () => {
      const jointPot = simulateFor(base, keepGrowingScenario);
      const separate = simulateFor(
        { ...base, p3: 0, p3Sep: { amount: base.p3, mode: 'grow' } },
        keepGrowingScenario,
      );

      expect(separate.expectedLifetime).toBeCloseTo(jointPot.expectedLifetime, within(1));
    });

    it('leaves less money at 65 when withdrawn at once, as the withdrawal is taxed', () => {
      const lumpSum = simulateFor(
        { ...base, p3: 0, p3Sep: { amount: base.p3, mode: 'lump' } },
        scenarioB,
      );
      const jointPot = simulateFor(base, scenarioB);

      expect(rowAt(lumpSum, 65).moneyLeft).toBeLessThan(rowAt(jointPot, 65).moneyLeft);
    });

    it('pays an income every year as a fund pension', () => {
      const fundPension = simulateFor(
        { ...base, p3: 0, p3Sep: { amount: base.p3, mode: 'fund' } },
        scenarioA,
      );

      expect(rowAt(fundPension, 66).i23).toBeGreaterThan(0);
    });
  });

  describe('bridge scenario with a single fund pension contract', () => {
    const low: PensionInput = { ...base, needMonthly: 300 };
    const once = simulateFor(low, { ...scenarioC, deferral: 2, contract: 'once' });
    const yearly = simulateFor(low, { ...scenarioC, deferral: 2, contract: 'yearly' });

    it('renews the contract every year by default', () => {
      const byDefault = simulateFor(low, { ...scenarioC, deferral: 2 });

      expect(byDefault.rows.map(({ i23 }) => i23)).toEqual(yearly.rows.map(({ i23 }) => i23));
    });

    it('pays no state pension in the two deferred years', () => {
      expect(rowAt(once, 66).i1).toBe(0);
    });

    it('pays a state pension 16.88% higher once the deferral ends', () => {
      expect(rowAt(once, 67).i1).toBeCloseTo(900 * 1.1688, within(0.01));
    });

    it('lets the contract payment follow the fund value', () => {
      expect(rowAt(once, 80).i23 / rowAt(once, 70).i23).toBeCloseTo(1.02 ** 10, within(1e-9));
    });

    it('pays nothing at 86, after the contract ends', () => {
      expect(rowAt(once, 86).i23).toBe(0);
    });

    it('keeps paying at 86 when the contract is renewed every year', () => {
      expect(rowAt(yearly, 86).i23).toBeGreaterThan(0);
    });

    it('pays more at 75 than a contract renewed every year', () => {
      expect(rowAt(once, 75).i23).toBeGreaterThan(rowAt(yearly, 75).i23);
    });

    it('pays the same as the single contract scenario at 70 when the state pension is not deferred', () => {
      const singleContract = simulateFor(low, scenarioB);
      const bridgeWithoutDeferral = simulateFor(low, {
        ...scenarioC,
        deferral: 0,
        contract: 'once',
      });

      expect(rowAt(bridgeWithoutDeferral, 70).i23).toBeCloseTo(
        rowAt(singleContract, 70).i23,
        within(0.01),
      );
    });
  });

  describe('separate third pillar fund pension contract', () => {
    type ContractTerms = Omit<SeparateThirdPillar, 'amount' | 'mode'>;

    const simulateThirdPillar = (terms: ContractTerms, scenario: Scenario) =>
      simulateFor(
        {
          ...base,
          needMonthly: 300,
          p3: 0,
          p3Sep: { amount: 20000, mode: 'fund', ...terms },
        },
        scenario,
      );
    const once = simulateThirdPillar({ contract: 'once' }, keepGrowingScenario);
    const yearly = simulateThirdPillar({ contract: 'yearly' }, keepGrowingScenario);
    const term = fundPensionTerm(lifeTable, 'N', 65);

    it('lets a single contract payment follow the fund value', () => {
      expect(rowAt(once, 65 + term - 1).i23 / rowAt(once, 66).i23).toBeCloseTo(
        1.02 ** (term - 2),
        within(1e-9),
      );
    });

    it('ends a single contract at the end of its term', () => {
      expect(rowAt(once, 65 + term).i23).toBe(0);
    });

    it('keeps paying after the term when the contract is renewed every year', () => {
      expect(rowAt(yearly, 65 + term).i23).toBeGreaterThan(0);
    });

    it('renews the contract every year by default', () => {
      const byDefault = simulateThirdPillar({}, keepGrowingScenario);

      expect(byDefault.rows.map(({ i23 }) => i23)).toEqual(yearly.rows.map(({ i23 }) => i23));
    });

    it('counts the term from 55 when the fund pension starts at 55', () => {
      const termFrom55 = fundPensionTerm(lifeTable, 'N', 55);
      const from55 = simulateThirdPillar({ contract: 'once', start: 55 }, keepGrowingScenario);

      expect(rowAt(from55, 55 + termFrom55 - 1).i23).toBeGreaterThan(0);
      expect(rowAt(from55, 55 + termFrom55).i23).toBe(0);
    });

    it('is a contract of its own, apart from the second pillar single contract', () => {
      const withOnce = simulateThirdPillar({ contract: 'once' }, scenarioB);
      const withYearly = simulateThirdPillar({ contract: 'yearly' }, scenarioB);

      expect(withOnce.rows.map(({ i23 }) => i23)).not.toEqual(
        withYearly.rows.map(({ i23 }) => i23),
      );
    });
  });

  describe('third pillar return', () => {
    const separate: PensionInput = {
      ...base,
      needMonthly: 300,
      p3: 0,
      p3Sep: { amount: 20000, mode: 'fund', contract: 'yearly' },
    };
    const sameReturn = simulateFor(separate, scenarioB);

    it('defaults to the second pillar return', () => {
      expect(simulateFor({ ...separate, realReturn3: 0.02 }, scenarioB).rows).toEqual(
        sameReturn.rows,
      );
    });

    it('does not change second pillar payments', () => {
      const higherReturn = simulateFor({ ...separate, realReturn3: 0.04 }, scenarioB);

      expect(higherReturn.rows.map(({ i2 }) => i2)).toEqual(sameReturn.rows.map(({ i2 }) => i2));
    });

    it('raises third pillar payments when higher', () => {
      const higherReturn = simulateFor({ ...separate, realReturn3: 0.04 }, scenarioB);
      const paysThirdPillar = ({ i3 }: SimulationRow) => i3 > 0;

      expect(findRow(higherReturn, paysThirdPillar).i3).toBeGreaterThan(
        findRow(sameReturn, paysThirdPillar).i3,
      );
    });
  });
});
