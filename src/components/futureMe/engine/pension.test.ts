import golden from './golden.json';
import goldenProfiles from './goldenProfiles.json';
import lifeTableData from './lifeTable.json';
import {
  EARLY_DECREASE,
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
    expect(pensionAge(1962)).toMatchObject({ years: 65, months: 1 });
    expect(pensionAge(1963)).toMatchObject({ years: 65, months: 3 });
    expect(pensionAge(1964)).toMatchObject({ years: 65, months: 4 });
  });

  describe('special pension', () => {
    const hazardList1WithSpecialPensionFrom58: PensionInput = {
      birthYear: 1980,
      sex: 'M',
      p1Monthly: 903,
      p2: 0,
      p3: 0,
      pensionAgeYears: 66,
      needMonthly: 791,
      realReturn: 0.02,
      hazard: 'list1',
      spHas: true,
      spMonthly: 1200,
      spStartAge: 58,
      firstPillarChoice: 'special',
    };

    it('pays the old-age pension from retirement until the special pension starts', () => {
      const { rows } = simulate(hazardList1WithSpecialPensionFrom58, lifeTable, scenarioA);
      const at = (age: number) => rows.find((row) => row.age === age);
      expect(at(56)?.i1g).toBeGreaterThan(0);
      expect(at(57)?.i1g).toBeGreaterThan(0);
      expect(at(57)?.ispg).toBe(0);
      expect(at(58)?.i1g).toBe(0);
      expect(at(58)?.ispg).toBeGreaterThan(0);
    });

    const threeKidsChoosingFlexibleFourYearsEarly: PensionInput = {
      birthYear: 1980,
      sex: 'N',
      p1Monthly: 903,
      p2: 0,
      p3: 0,
      pensionAgeYears: 66,
      needMonthly: 791,
      realReturn: 0.02,
      kids: { b2012: 3, earlyUser: 'me' },
      soodus: 4,
      flexEarly: 4,
      spHas: true,
      spMonthly: 800,
      firstPillarChoice: 'oldAge',
    };

    it('grants no flexible pension when the special pension is already paid at its start', () => {
      const withSpecialPensionFrom60 = {
        ...threeKidsChoosingFlexibleFourYearsEarly,
        spStartAge: 60,
      };
      const { rows, firstPillar } = simulate(withSpecialPensionFrom60, lifeTable, scenarioA);
      const oldAgePensionAt = (age: number) => rows.find((row) => row.age === age)?.i1g;
      expect(firstPillar?.oldAge).toBe(903);
      expect(oldAgePensionAt(64)).toBe(0);
      expect(oldAgePensionAt(65)).toBeGreaterThan(0);
    });

    it('keeps the flexible pension when the special pension starts after it', () => {
      const withSpecialPensionFrom64 = {
        ...threeKidsChoosingFlexibleFourYearsEarly,
        spStartAge: 64,
      };
      const { firstPillar } = simulate(withSpecialPensionFrom64, lifeTable, scenarioA);
      expect(firstPillar?.oldAge).toBeCloseTo(903 * (1 - EARLY_DECREASE[4]));
    });

    const retiringFiveYearsEarlyAndWorkingOnUntil66: PensionInput = {
      birthYear: 1989,
      sex: 'N',
      p1Monthly: 931,
      p2: 0,
      p3: 0,
      pensionAgeYears: 66,
      needMonthly: 791,
      realReturn: 0.02,
      grossMonthly: 2000,
      p2Rate: 0.02,
      soodus: 5,
      workOn: true,
      workUntil: 66,
      spHas: true,
      spMonthly: 900,
    };

    it('compares a special pension starting after retirement with the old-age pension paid by its start', () => {
      const withSpecialPensionFrom63 = {
        ...retiringFiveYearsEarlyAndWorkingOnUntil66,
        spStartAge: 63,
      };
      const { firstPillar } = simulate(withSpecialPensionFrom63, lifeTable, scenarioA);
      const { rows } = simulate(
        { ...withSpecialPensionFrom63, firstPillarChoice: 'oldAge' },
        lifeTable,
        scenarioA,
      );
      const oldAgePensionAt63 = rows.find((row) => row.age === 63)?.i1g;
      expect(firstPillar?.oldAge).toBeCloseTo(oldAgePensionAt63 as number);
      expect(firstPillar?.oldAge).toBeGreaterThan(900);
      expect(firstPillar).toMatchObject({ larger: 'oldAge', paid: 'oldAge' });
    });

    it('does not ask again at the pension age when the special pension starts there', () => {
      const withLargerSpecialPensionFrom66 = {
        ...retiringFiveYearsEarlyAndWorkingOnUntil66,
        spMonthly: 1000,
        spStartAge: 66,
      };
      const { firstPillar } = simulate(withLargerSpecialPensionFrom66, lifeTable, scenarioA);
      expect(firstPillar).toMatchObject({ paid: 'special', atPa: null });
    });
  });
});
