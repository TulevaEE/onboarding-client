import goldenProfiles from './goldenProfiles.json';
import golden from './golden.json';
import lifeTableData from './lifeTable.json';
import {
  careHomeShare,
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
    [
      'alone',
      'frugal',
      { beefOnHolidaysOnly: true, beefKg: 1, fuelTanks: 0.5, cafeLunches: 1, tripsPerYear: 0 },
    ],
    [
      'alone',
      'optimal',
      { beefOnHolidaysOnly: false, beefKg: 1.8, fuelTanks: 1, cafeLunches: 2, tripsPerYear: 0 },
    ],
    [
      'alone',
      'comfortable',
      { beefOnHolidaysOnly: false, beefKg: 4.4, fuelTanks: 1, cafeLunches: 3, tripsPerYear: 1 },
    ],
    [
      'couple',
      'frugal',
      { beefOnHolidaysOnly: true, beefKg: 1, fuelTanks: 1, cafeLunches: 1, tripsPerYear: 0 },
    ],
    [
      'couple',
      'comfortable',
      { beefOnHolidaysOnly: false, beefKg: 3.9, fuelTanks: 1.5, cafeLunches: 3, tripsPerYear: 0 },
    ],
  ] as [Household, (typeof COST_LEVELS)[number], object][])(
    'describes what the %s %s level buys the way the prototype does',
    (household, level, expected) => {
      expect(costFacts(household, level)).toMatchObject(expected);
    },
  );

  it('shows the gifts line of the level among the facts', () => {
    expect(costFacts('alone', 'comfortable').gifts).toBe(32);
    expect(costFacts('couple', 'frugal').gifts).toBe(16);
  });

  it('puts the care home share the comfortable level could cover at 1000 euros', () => {
    expect(careHomeShare).toBe(1000);
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
