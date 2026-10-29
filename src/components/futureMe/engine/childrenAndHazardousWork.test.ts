import {
  AASTAHINNE,
  childPillar2,
  childSupplement,
  CURRENT_YEAR,
  DEFERRAL_INCREASE,
  earlyYears,
  hazardSupplement,
  KidsInput,
  PensionInput,
  retirementYears,
  simulate,
} from './pension';
import { keepGrowingScenario, lifeTable, rowAt, scenarioD } from './testUtils';

const base: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 900,
  p2: 30000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0.02,
  p3Monthly: 0,
  needMonthly: 1200,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};
const retirementAge = retirementYears(base);
const stateContribution2026 = 76.12;
const stateContribution2027 = 80.76;

const withChildren = (kids: KidsInput): PensionInput => ({
  ...base,
  kids: {
    b1991: 0,
    b2012: 0,
    b2013: 0,
    disabled: false,
    user: 'me',
    ...kids,
  },
});

describe('children', () => {
  describe('early retirement', () => {
    it.each([
      { children: 0, years: 0 },
      { children: 1, years: 0 },
      { children: 2, years: 0 },
      { children: 3, years: 1 },
      { children: 4, years: 3 },
      { children: 5, years: 5 },
      { children: 7, years: 5 },
    ])('lets a parent of $children children retire $years years early', ({ children, years }) => {
      expect(earlyYears(withChildren({ b2012: children }))).toBe(years);
    });

    it('lets a parent of a disabled child retire 5 years early', () => {
      expect(earlyYears(withChildren({ b2012: 1, disabled: true }))).toBe(5);
    });

    it('lets a parent retire as many years early as the birth dates give, when they are given', () => {
      expect(earlyYears(withChildren({ b2012: 1, disabled: true, yearsEarly: 2 }))).toBe(2);
    });

    it('counts the children of every birth period together', () => {
      expect(earlyYears(withChildren({ b1991: 2, b2013: 2 }))).toBe(3);
    });

    it('counts the children born from September 2021', () => {
      expect(earlyYears(withChildren({ b2013: 1, b2021: 2 }))).toBe(1);
    });

    it('gives no early retirement when the other parent uses the right', () => {
      expect(earlyYears(withChildren({ b2012: 5, user: 'other' }))).toBe(0);
    });

    it('starts the state pension early in the simulation when no early years are given', () => {
      expect(simulate(withChildren({ b2012: 4 }), lifeTable, scenarioD).pensionStartAge).toBe(
        retirementAge - 3,
      );
    });

    it('lets the given early years override the children', () => {
      expect(
        simulate({ ...withChildren({ b2012: 4 }), soodus: 0 }, lifeTable, scenarioD)
          .pensionStartAge,
      ).toBe(retirementAge);
    });
  });

  describe('pension supplement', () => {
    it('adds 3.5 year values per child born before 1991, as 1.5 plus 2 years of service', () => {
      expect(childSupplement(withChildren({ b1991: 2 }))).toBeCloseTo(7 * AASTAHINNE, 6);
    });

    it('adds 3.5 year values per child born from 1991 to 2012', () => {
      expect(childSupplement(withChildren({ b2012: 2 }))).toBeCloseTo(7 * AASTAHINNE, 6);
    });

    it('adds nothing for children born from 2013 while in the II pillar', () => {
      expect(childSupplement(withChildren({ b2013: 2 }))).toBeCloseTo(0, 6);
    });

    it('adds 3.5 year values per child born from 2013 to August 2021 without the II pillar to a parent born before 1983', () => {
      expect(childSupplement({ ...withChildren({ b2013: 2 }), p2: 0, p2Rate: 0 })).toBeCloseTo(
        7 * AASTAHINNE,
        6,
      );
    });

    it('adds nothing for children born from 2013 to August 2021 without the II pillar to a parent born in 1983', () => {
      expect(
        childSupplement({ ...withChildren({ b2013: 2 }), birthYear: 1983, p2: 0, p2Rate: 0 }),
      ).toBeCloseTo(0, 6);
    });

    it('adds one supplement for a child born from 2013 to August 2021 the parent was outside the II pillar for, even if in it today', () => {
      expect(childSupplement(withChildren({ b2013: 2, b2013noII: 1 }))).toBeCloseTo(
        3.5 * AASTAHINNE,
        6,
      );
    });

    it('adds nothing for children born from 2013 to August 2021 the parent was in the II pillar for, even if not today', () => {
      expect(
        childSupplement({ ...withChildren({ b2013: 2, b2013noII: 0 }), p2: 0, p2Rate: 0 }),
      ).toBeCloseTo(0, 6);
    });

    it('ignores the per-child II pillar answer of a parent born from 1983', () => {
      expect(
        childSupplement({ ...withChildren({ b2013: 2, b2013noII: 2 }), birthYear: 1983 }),
      ).toBeCloseTo(0, 6);
    });

    it('adds 3.5 year values per child born from September 2021 without the II pillar, also to a parent born from 1983', () => {
      expect(
        childSupplement({ ...withChildren({ b2021: 2 }), birthYear: 1990, p2: 0, p2Rate: 0 }),
      ).toBeCloseTo(7 * AASTAHINNE, 6);
    });

    it('adds nothing for children born from September 2021 while in the II pillar', () => {
      expect(childSupplement(withChildren({ b2021: 2 }))).toBeCloseTo(0, 6);
    });

    it('adds nothing when the other parent uses the right', () => {
      expect(childSupplement(withChildren({ b2012: 3, user: 'other' }))).toBe(0);
    });

    describe('for children born from September 2021 who are over 3', () => {
      const inSecondPillar: PensionInput = { ...base, birthYear: 1990, p2: 10000, p2Rate: 0.02 };
      const withOlderChildren = (kids: KidsInput): PensionInput => ({
        ...inSecondPillar,
        kids: { b2021: 2, u3: 0, supUser: 'me', ...kids },
      });

      it('adds nothing in the II pillar after the default 36 months of state contributions', () => {
        expect(childSupplement(withOlderChildren({}))).toBeCloseTo(0, 6);
      });

      it('adds two thirds after 12 months of state contributions and nothing after 36', () => {
        expect(childSupplement(withOlderChildren({ iiMonths: [12, 36] }))).toBeCloseTo(
          (AASTAHINNE * 3.5 * 2) / 3,
          9,
        );
      });

      it('adds a full supplement after no state contributions and half after 18 months', () => {
        expect(childSupplement(withOlderChildren({ iiMonths: [0, 18] }))).toBeCloseTo(
          AASTAHINNE * 3.5 * 1.5,
          9,
        );
      });

      it('adds a full supplement without the II pillar, assuming no state contributions', () => {
        expect(
          childSupplement({
            ...inSecondPillar,
            p2: 0,
            p2Rate: 0,
            kids: { b2021: 1, u3: 0, supUser: 'me' },
          }),
        ).toBeCloseTo(AASTAHINNE * 3.5, 9);
      });
    });
  });

  describe('state II pillar contribution until the child is 3', () => {
    it('pays 18 months from January without a birth month, 12 at the 2026 rate and 6 at the 2027 rate', () => {
      expect(childPillar2(withChildren({ b2021: 2, u3: 1 }))).toBeCloseTo(
        12 * stateContribution2026 + 6 * stateContribution2027,
        6,
      );
    });

    it('counts no more children under 3 than children born from September 2021', () => {
      expect(childPillar2(withChildren({ b2021: 1, u3: 3 }))).toBeCloseTo(
        12 * stateContribution2026 + 6 * stateContribution2027,
        6,
      );
    });

    it('pays by birth month, from October for 30 months and for 3 months', () => {
      expect(
        childPillar2(withChildren({ b2021: 2, u3: 2, u3Left: [30, 3], monthNow: 9 })),
      ).toBeCloseTo(
        3 * stateContribution2026 + 27 * stateContribution2027 + 3 * stateContribution2026,
        6,
      );
    });

    it('pays nothing once the child is 3', () => {
      expect(childPillar2(withChildren({ b2021: 1, u3: 1, u3Left: [0] }))).toBeCloseTo(0, 6);
    });

    it('pays nothing without own II pillar contributions', () => {
      expect(childPillar2({ ...withChildren({ b2021: 1, u3: 1 }), p2Rate: 0 })).toBe(0);
    });

    it('pays nothing when the other parent receives it', () => {
      expect(childPillar2(withChildren({ b2021: 1, u3: 1, supUser: 'other' }))).toBe(0);
    });

    describe('until II pillar payouts start', () => {
      const child = withChildren({ b2021: 1, u3: 1, u3Left: [36], monthNow: 0 });
      const ageNow = CURRENT_YEAR - child.birthYear;

      it('pays only the 12 months of the current year when payouts start next year', () => {
        expect(childPillar2(child, ageNow + 1)).toBeCloseTo(12 * stateContribution2026, 6);
      });

      it('pays nothing when payouts have already started', () => {
        expect(childPillar2(child, ageNow)).toBeCloseTo(0, 6);
      });

      it('pays all 36 months when payouts start after the child is 3', () => {
        expect(childPillar2(child, ageNow + 10)).toBeCloseTo(childPillar2(child), 6);
      });

      it('pays a future child from its birth year, not from today', () => {
        const futureChild = withChildren({
          b2021: 1,
          u3: 1,
          u3Left: [36],
          u3Start: [CURRENT_YEAR + 2],
          u3StartMonth: [1],
          monthNow: 0,
        });
        expect(childPillar2(futureChild, ageNow + 3)).toBeCloseTo(12 * 80.76, 6);
      });
    });

    it('reaches the II pillar assets at pension age', () => {
      const young: PensionInput = { ...base, birthYear: 1994, p2Rate: 0.02, grossMonthly: 2000 };
      const youngRetirementAge = retirementYears(young);
      const withChild = simulate(
        { ...young, kids: { b2021: 1, u3: 1, user: 'me' } },
        lifeTable,
        scenarioD,
      );
      const withoutChild = simulate(young, lifeTable, scenarioD);
      expect(
        rowAt(withChild, youngRetirementAge).moneyLeft -
          rowAt(withoutChild, youngRetirementAge).moneyLeft,
      ).toBeCloseTo(12 * stateContribution2026 + 6 * stateContribution2027, 3);
    });
  });

  describe('supplement in the state pension', () => {
    const withSupplement = simulate(withChildren({ b2012: 2 }), lifeTable, keepGrowingScenario);

    it('is added on top of the state pension', () => {
      expect(rowAt(withSupplement, retirementAge).i1g).toBeCloseTo(900 + 7 * AASTAHINNE, 6);
    });

    it('is reported with its monthly amount', () => {
      expect(withSupplement.childSupplement).toEqual({ monthly: 7 * AASTAHINNE });
    });

    it('is raised by the deferral increase along with the rest of the pension', () => {
      const deferred = simulate(withChildren({ b2012: 2 }), lifeTable, { id: 'C', deferral: 2 });
      expect(rowAt(deferred, retirementAge + 2).i1g).toBeCloseTo(
        (900 + 7 * AASTAHINNE) * (1 + DEFERRAL_INCREASE[2]),
        6,
      );
    });

    describe('with a special pension', () => {
      const result = simulate(
        { ...withChildren({ b2012: 3 }), soodus: 0, spMonthly: 920, spStartAge: 55 },
        lifeTable,
        keepGrowingScenario,
      );

      it('compares the special pension with the old-age pension plus the supplement', () => {
        expect(result.firstPillar?.paid).toBe('oldAge');
      });

      it('is added only to the old-age pension', () => {
        expect(rowAt(result, retirementAge).i1g).toBeCloseTo(900 + 10.5 * AASTAHINNE, 6);
      });
    });
  });

  it('leaves the simulation unchanged without children', () => {
    expect(
      simulate(
        {
          ...base,
          kids: { b1991: 0, b2012: 0, b2013: 0, user: 'me' },
        },
        lifeTable,
        scenarioD,
      ).rows,
    ).toEqual(simulate(base, lifeTable, scenarioD).rows);
  });

  describe('rights held by different parents', () => {
    const earlyRetirementForOther = withChildren({ b2012: 4, earlyUser: 'other', supUser: 'me' });
    const supplementForOther = withChildren({ b2012: 4, earlyUser: 'me', supUser: 'other' });

    it('gives no early retirement when the other parent uses it', () => {
      expect(earlyYears(earlyRetirementForOther)).toBe(0);
    });

    it('adds the supplement when this parent uses it', () => {
      expect(childSupplement(earlyRetirementForOther)).toBeCloseTo(14 * AASTAHINNE, 6);
    });

    it('gives early retirement when this parent uses it', () => {
      expect(earlyYears(supplementForOther)).toBe(3);
    });

    it('adds no supplement when the other parent uses it', () => {
      expect(childSupplement(supplementForOther)).toBe(0);
    });
  });
});

describe('hazardous work', () => {
  describe('early retirement', () => {
    it('retires 10 years early after list 1 work', () => {
      expect(earlyYears({ ...base, hazard: 'list1' })).toBe(10);
    });

    it('does not retire early after under 10 years of list 1 work', () => {
      expect(earlyYears({ ...base, hazard: 'list1', hazardYears: 5 })).toBe(0);
    });

    it('retires 5 years early after list 2 work', () => {
      expect(earlyYears({ ...base, hazard: 'list2' })).toBe(5);
    });

    it('takes the larger of hazardous work and children', () => {
      expect(earlyYears({ ...withChildren({ b2012: 3 }), hazard: 'list2' })).toBe(5);
    });

    it('gives no early retirement without children or hazardous work', () => {
      expect(earlyYears(base)).toBe(0);
    });
  });

  describe('pension supplement', () => {
    it('adds a supplement for each year of list 1 work, also under 10 years', () => {
      expect(
        hazardSupplement({ ...base, hazard: 'list1', hazardYears: 5, undergroundYears: 0 }),
      ).toBeCloseTo(AASTAHINNE * 0.031 * 5, 6);
    });

    it('adds 3.1% of the year value per list 1 year and 21.9% more per underground year', () => {
      expect(
        hazardSupplement({ ...base, hazard: 'list1', hazardYears: 20, undergroundYears: 5 }),
      ).toBeCloseTo(AASTAHINNE * (0.031 * 20 + 0.219 * 5), 6);
    });

    it('adds nothing for list 2 work', () => {
      expect(hazardSupplement({ ...base, hazard: 'list2', hazardYears: 20 })).toBe(0);
    });

    it('counts no more underground years than list 1 years', () => {
      expect(
        hazardSupplement({ ...base, hazard: 'list1', hazardYears: 10, undergroundYears: 30 }),
      ).toBeCloseTo(AASTAHINNE * (0.031 * 10 + 0.219 * 10), 6);
    });

    describe('in the simulation', () => {
      const result = simulate(
        { ...base, hazard: 'list1', hazardYears: 15, undergroundYears: 0 },
        lifeTable,
        scenarioD,
      );

      it('reaches the state pension', () => {
        expect(rowAt(result, retirementAge).i1g).toBeCloseTo(900 + AASTAHINNE * 0.031 * 15, 6);
      });

      it('is reported', () => {
        expect(result.hazardSupplement).toBeCloseTo(AASTAHINNE * 0.031 * 15, 6);
      });
    });
  });
});
