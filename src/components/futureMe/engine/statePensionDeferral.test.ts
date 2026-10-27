import { bestDeferral, PensionInput, Scenario, simulate } from './pension';
import { coversNeedUntilHorizon, isWithin, lifeTable, scenarioC } from './testUtils';

const deferralsFrom = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) => first + index);

const base: PensionInput = {
  birthYear: 1966,
  sex: 'M',
  p1Monthly: 1000,
  p2: 40000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 1300,
  realReturn: 0.02,
  depositReturn: -0.01,
  extraDeposit: 0,
};

const needsAndMaximumDeferrals = [900, 1100, 1300, 1500, 1800].flatMap((need) =>
  [1, 3, 5].map((maximumDeferral) => [need, maximumDeferral]),
);

const bridgeScenario = (deferral: number): Scenario => ({ ...scenarioC, deferral });

describe('state pension deferral with a bridge from the pillars', () => {
  const fiveYearBridge = simulate(base, lifeTable, bridgeScenario(5));

  it('pays the pillar income as the contract payment plus the extra withdrawal every year', () => {
    const rowsWhereIncomeDiffers = fiveYearBridge.rows.filter(
      ({ i23, fp, extra }) => !isWithin(i23, fp + extra, 1e-6),
    );
    expect(rowsWhereIncomeDiffers).toEqual([]);
  });

  it('makes extra withdrawals in the bridge years', () => {
    expect(fiveYearBridge.rows.some(({ extra }) => extra > 0)).toBe(true);
  });

  it.each(needsAndMaximumDeferrals)(
    'picks the longest deferral that covers a need of %i € a month within a maximum of %i',
    (need, maximumDeferral) => {
      const input: PensionInput = { ...base, needMonthly: need };
      const best = bestDeferral(input, lifeTable, bridgeScenario(maximumDeferral));
      const candidates = deferralsFrom(best ?? 0, maximumDeferral);

      expect(best ?? 0).toBeLessThanOrEqual(maximumDeferral);
      expect(
        candidates.map((deferral) => ({
          deferral,
          covers: coversNeedUntilHorizon(simulate(input, lifeTable, bridgeScenario(deferral))),
        })),
      ).toEqual(candidates.map((deferral) => ({ deferral, covers: deferral === best })));
    },
  );

  it('finds a need that a shorter deferral covers but the longest one does not', () => {
    const shorterDeferralCovers = needsAndMaximumDeferrals.some(([need, maximumDeferral]) => {
      const best = bestDeferral(
        { ...base, needMonthly: need },
        lifeTable,
        bridgeScenario(maximumDeferral),
      );
      return best !== null && best < maximumDeferral;
    });

    expect(shorterDeferralCovers).toBe(true);
  });
});
