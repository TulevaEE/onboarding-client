import goldenProfiles from './goldenProfiles.json';
import golden from './golden.json';
import lifeTableData from './lifeTable.json';
import {
  CARE_HOME_OWN_SHARES,
  careHomeCoverage,
  COST_LEVELS,
  costFacts,
  costLines,
  Household,
  levelTotal,
} from './expenses';
import { LifeTable, PensionInput, Scenario, SCENARIOS, Sex, sustainableNeed } from './pension';

const lifeTable: LifeTable = lifeTableData;

describe('expenses', () => {
  it('offers the frugal, optimal and comfortable levels in that order', () => {
    expect(COST_LEVELS).toEqual(['frugal', 'optimal', 'comfortable']);
  });

  it.each([
    ['alone', 'frugal', 791],
    ['alone', 'optimal', 891],
    ['alone', 'comfortable', 1261],
    ['couple', 'frugal', 667],
    ['couple', 'optimal', 764],
    ['couple', 'comfortable', 1083],
  ] as [Household, (typeof COST_LEVELS)[number], number][])(
    'totals %s at the %s level to the prototype amount %i',
    (household, level, total) => {
      expect(levelTotal(household, level)).toBe(total);
    },
  );

  it('lists the thirteen Statistics Estonia categories and an empty own line', () => {
    const lines = costLines('alone', 'frugal');

    expect(lines).toHaveLength(14);
    expect(lines[0]).toEqual({ id: 'food', amount: 221 });
    expect(lines[lines.length - 1]).toEqual({ id: 'other', amount: 0 });
  });

  it('keeps the own line out of the level total', () => {
    const statistics = costLines('couple', 'comfortable').filter((line) => line.id !== 'other');

    expect(statistics.reduce((sum, line) => sum + line.amount, 0)).toBe(
      levelTotal('couple', 'comfortable'),
    );
  });

  it.each([
    ['alone', 'frugal', { foodPerDay: 7, fuelTanks: 0.5, cafeLunches: 1, tripsPerYear: 0 }],
    ['alone', 'optimal', { foodPerDay: 8, fuelTanks: 1, cafeLunches: 2, tripsPerYear: 0 }],
    ['alone', 'comfortable', { foodPerDay: 10, fuelTanks: 1, cafeLunches: 3, tripsPerYear: 1 }],
    ['couple', 'frugal', { foodPerDay: 6, fuelTanks: 1, cafeLunches: 1, tripsPerYear: 0 }],
    ['couple', 'comfortable', { foodPerDay: 9, fuelTanks: 1.5, cafeLunches: 3, tripsPerYear: 1 }],
  ] as [Household, (typeof COST_LEVELS)[number], object][])(
    'describes what the %s %s level buys',
    (household, level, expected) => {
      expect(costFacts(household, level)).toMatchObject(expected);
    },
  );

  it('shows the gifts line of the level among the facts', () => {
    expect(costFacts('alone', 'comfortable').gifts).toBe(32);
    expect(costFacts('couple', 'frugal').gifts).toBe(16);
  });

  it('puts the own share of a cheaper, an average and a dearer care home at 750, 950 and 1050 euros', () => {
    expect(CARE_HOME_OWN_SHARES).toEqual({ cheaper: 750, average: 950, dearer: 1050 });
  });

  describe('care home coverage', () => {
    it.each([
      [1261, { covers: 'dearer', missing: 0 }],
      [1050, { covers: 'dearer', missing: 0 }],
      [1049, { covers: 'average', missing: 10 }],
      [950, { covers: 'average', missing: 100 }],
      [891, { covers: 'cheaper', missing: 60 }],
      [750, { covers: 'cheaper', missing: 200 }],
      [667, { covers: 'none', missing: 80 }],
      [0, { covers: 'none', missing: 750 }],
    ] as const)('of %i euros a month is %j', (monthlyNeed, expected) => {
      expect(careHomeCoverage(monthlyNeed)).toEqual(expected);
    });

    it('measures what is missing against the next dearer place, rounded to ten euros', () => {
      expect(careHomeCoverage(791)).toEqual({ covers: 'cheaper', missing: 160 });
    });
  });

  describe('sustainable need', () => {
    const [scenarioA] = SCENARIOS;
    const scenarios: Record<string, Scenario> = { A: scenarioA, E: { id: 'E' } };

    it.each(Object.entries(goldenProfiles))(
      'is the prototype value for %s whichever level is chosen',
      (profileId, profile) => {
        const expected = golden[profileId as keyof typeof golden].sustainable as Record<
          string,
          number
        >;

        COST_LEVELS.forEach((level) => {
          const input: PensionInput = {
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
            needMonthly: levelTotal('alone', level),
            realReturn: 0.02,
            depositReturn: 0,
            extraDeposit: 0,
          };

          Object.entries(scenarios).forEach(([scenarioId, scenario]) => {
            expect(sustainableNeed(input, lifeTable, scenario)).toBe(expected[scenarioId]);
          });
        });
      },
    );
  });
});
