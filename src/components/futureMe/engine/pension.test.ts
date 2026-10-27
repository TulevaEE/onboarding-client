import golden from './golden.json';
import goldenProfiles from './goldenProfiles.json';
import lifeTableData from './lifeTable.json';
import {
  LifeTable,
  PensionInput,
  pensionAge,
  retirementYears,
  Scenario,
  SCENARIOS,
  Sex,
  simulate,
  sustainableNeed,
} from './pension';

const lifeTable: LifeTable = lifeTableData;

type GoldenProfile = (typeof goldenProfiles)[keyof typeof goldenProfiles];
type GoldenScenarioValues = Record<string, number>;

const [scenarioA, scenarioB, scenarioC, scenarioD] = SCENARIOS;
const goldenScenarios: Record<string, Scenario> = {
  A: scenarioA,
  B: scenarioB,
  C: { ...scenarioC, deferral: 2 },
  D: scenarioD,
  E: { id: 'E' },
  E3: { id: 'E', deferral: 3 },
};

const toInput = (profile: GoldenProfile): PensionInput => ({
  birthYear: profile.birthYear,
  sex: profile.sex as Sex,
  pensionAgeYears: profile.pensionAgeYears,
  p1Monthly: profile.p1Monthly,
  p2: profile.p2,
  p3: profile.p3,
  p3Before2021: profile.p3Joined === 'before',
  grossMonthly: profile.grossMonthly,
  p2Rate: Number(profile.p2Rate),
  p3Monthly: profile.p3Monthly,
  needMonthly: 791,
  realReturn: 0.02,
  depositReturn: 0,
  extraDeposit: 0,
});

const snapshotScenario = (input: PensionInput, scenario: Scenario): GoldenScenarioValues => {
  const { rows } = simulate(input, lifeTable, scenario);
  const pa = retirementYears(input);
  const at = (age: number) => rows.find((row) => row.age === age);
  const atPension65 = at(Math.max(pa, 65));
  const atPension = at(pa);
  const at80 = at(80);
  return {
    i1_65: Math.round(atPension65?.i1 || 0),
    i1g_65: Math.round(atPension65?.i1g || 0),
    tax1_65: Math.round(atPension65?.tax1 || 0),
    i23_pa: Math.round(atPension?.i23 || 0),
    spend_80: Math.round(at80?.spend || 0),
    short_80: Math.round(at80?.shortfall || 0),
    money_pa: Math.round(atPension?.moneyLeft || 0),
    money_80: Math.round(at80?.moneyLeft || 0),
    summa_i2: Math.round(rows.reduce((sum, row) => sum + (row.i2 || 0) * 12, 0)),
    summa_tax: Math.round(rows.reduce((sum, row) => sum + (row.tax1 || 0) * 12, 0)),
  };
};

describe('pension engine', () => {
  describe.each(Object.entries(goldenProfiles))('golden profile %s', (profileId, profile) => {
    const input = toInput(profile);
    const expected = golden[profileId as keyof typeof golden] as unknown as Record<
      string,
      GoldenScenarioValues
    >;

    it.each(Object.entries(goldenScenarios))('matches scenario %s', (scenarioId, scenario) => {
      expect(snapshotScenario(input, scenario)).toEqual(expected[scenarioId]);
    });

    it('matches sustainable need for every scenario', () => {
      const sustainable = Object.fromEntries(
        Object.entries(goldenScenarios).map(([scenarioId, scenario]) => [
          scenarioId,
          sustainableNeed(input, lifeTable, scenario),
        ]),
      );
      expect(sustainable).toEqual(expected.sustainable);
    });
  });

  it('uses the pension ages set for 2027 to 2029', () => {
    expect(pensionAge(1962).label).toBe('65 a 1 k');
    expect(pensionAge(1963).label).toBe('65 a 3 k');
    expect(pensionAge(1964).label).toBe('65 a 4 k');
  });
});
