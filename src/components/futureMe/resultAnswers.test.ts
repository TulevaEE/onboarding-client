import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { age55Of } from './age55';
import {
  coverageKind,
  incomeAtStart,
  resultInputOf,
  resultOf,
  ResultContext,
  resultScenarioOf,
} from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };

const contextWith = (
  changes: Partial<ReturnType<typeof initialAnswers>> = {},
  rest: Partial<Omit<ResultContext, 'you' | 'plan'>> = {},
): ResultContext => {
  const you = {
    ...initialAnswers(noPrefill),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    ...changes,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
    ...rest,
  };
};

describe('resultAnswers', () => {
  describe('engine input', () => {
    it('takes the savings, the return of the chosen fund and the monthly need from the answers', () => {
      const input = resultInputOf(
        contextWith({ secondPillarAmount: '25000', secondPillarFund: 'index' }),
      );

      expect(input).toMatchObject({
        p2: 25000,
        realReturn: 0.04,
        needMonthly: 791,
        p1Monthly: 700,
      });
    });

    it('has no separate III pillar without savings or contributions there', () => {
      expect(resultInputOf(contextWith()).p3Sep).toBeNull();
    });

    it('keeps the III pillar apart with its own fund and the payout chosen for it', () => {
      const context = contextWith(
        { thirdPillarJoined: 'before', thirdPillarAmount: '8000', thirdPillarFund: 'cons' },
        { age65: { ...initialAge65(), thirdPillar: 'lump' } },
      );

      const input = resultInputOf(context);

      expect(input.p3Sep).toMatchObject({ amount: 8000, mode: 'lump' });
      expect(input.realReturn3).toBe(0);
    });

    it('has no special pension unless an amount was typed for it', () => {
      expect(resultInputOf(contextWith()).spMonthly).toBe(0);
      expect(
        resultInputOf(
          contextWith(
            { hasSpecialPension: true, workAdded: true, specialPensionStartAge: '55' },
            { specialPension: { ...initialSpecialPension(), monthly: '900' } },
          ),
        ).spMonthly,
      ).toBe(900);
    });

    it('drops a special pension the saver no longer has, though its amount was typed earlier', () => {
      const input = resultInputOf(
        contextWith(
          { hasSpecialPension: false, workAdded: true },
          { specialPension: { ...initialSpecialPension(), monthly: '900' } },
        ),
      );

      expect(input).toMatchObject({ spHas: false, spMonthly: 0 });
    });

    describe('for a special pension kept on an early retirement', () => {
      const earlyWithSpecialPension = {
        hasSpecialPension: true,
        workAdded: true,
        specialPensionStartAge: '55',
        hazardList: 'list1' as const,
        hazardYears: '10',
      };
      const specialPension = { ...initialSpecialPension(), monthly: '1200' };
      const choiceAtPensionAge = { ...initialAge66(), firstPillarChoicePa: 'oldAge' as const };

      it('sends the choice made at the pension age while that choice is asked', () => {
        const workingOn = { ...initialAge65(), work: 'yes' as const, workUntil: '70' };

        expect(
          resultInputOf(
            contextWith(earlyWithSpecialPension, {
              specialPension,
              age65: workingOn,
              age66: choiceAtPensionAge,
            }),
          ).firstPillarChoicePa,
        ).toBe('oldAge');
      });

      it('drops the choice made at the pension age once it is no longer asked', () => {
        expect(
          resultInputOf(
            contextWith(earlyWithSpecialPension, { specialPension, age66: choiceAtPensionAge }),
          ).firstPillarChoicePa,
        ).toBeUndefined();
      });
    });

    it('carries a changed III pillar contribution after an early retirement into the engine', () => {
      const early = {
        workAdded: true,
        hazardList: 'list1' as const,
        hazardYears: '10',
        thirdPillarJoined: 'after' as const,
        thirdPillarMonthly: '50',
      };
      const stopping = {
        ...initialAge65(),
        thirdPillarAfterMode: 'change' as const,
        thirdPillarAfter: '0',
      };

      expect(resultInputOf(contextWith(early, { age65: stopping })).p3After).toBe(0);
      expect(resultInputOf(contextWith(early)).p3After).toBeUndefined();
    });

    it('counts III pillar contributions only from the age the saver plans to open it', () => {
      const openingAt = (thirdPillarOpenAge: string) =>
        resultInputOf(
          contextWith({ thirdPillarJoined: 'none', thirdPillarMonthly: '100', thirdPillarOpenAge }),
        ).p3Sep?.amount as number;

      expect(openingAt('50')).toBeLessThan(0);
      expect(openingAt('60')).toBeLessThan(openingAt('50'));
    });
  });

  describe('with the III pillar plan chosen at 55', () => {
    const saver = {
      thirdPillarJoined: 'before' as const,
      thirdPillarAmount: '8000',
      thirdPillarMonthly: '100',
      thirdPillarFund: 'cons' as const,
    };
    const separateOf = (changes: Parameters<typeof contextWith>[0], rest = {}) =>
      resultInputOf(contextWith({ ...saver, ...changes }, rest)).p3Sep;

    it('keeps the savings growing while the plan is to keep them', () => {
      expect(separateOf({ thirdPillarPlan: 'keep' })).toMatchObject({ amount: 8000 });
    });

    it('drops the savings and the contributions made before 55 when they are taken at once', () => {
      const withSavings = separateOf({ thirdPillarPlan: 'lump' });
      const withMore = separateOf({ thirdPillarPlan: 'lump', thirdPillarAmount: '20000' });

      expect(withSavings?.amount).toBeLessThan(0);
      expect(withSavings?.amount).toBeCloseTo(withMore?.amount as number);
      expect(withSavings?.mode).toBe('grow');
    });

    it('has nothing left to grow when taken at once without further contributions', () => {
      expect(separateOf({ thirdPillarPlan: 'lump', thirdPillarMonthly: '0' })?.amount).toBeCloseTo(
        0,
      );
    });

    it('starts the fund pension at 55 and carries what is left at the pension age', () => {
      const fundPlan = { thirdPillarPlan: 'fund' as const, thirdPillarMonthly: '0' };

      expect(separateOf(fundPlan)).toMatchObject({ mode: 'fund', start: 55 });
      expect(separateOf(fundPlan)?.amount).toBeCloseTo(
        age55Of(contextWith({ ...saver, ...fundPlan }).you, 1).payout?.leftAtPension as number,
      );
    });

    it('pays out the rest at once when that is chosen at the pension age', () => {
      const lumpAtPensionAge = { age65: { ...initialAge65(), thirdPillar: 'lump' as const } };

      expect(separateOf({ thirdPillarPlan: 'fund' }, lumpAtPensionAge)?.mode).toBe('lump');
    });

    it('keeps paying the fund pension while working past the pension age', () => {
      const fundPlan = { thirdPillarPlan: 'fund' as const, thirdPillarMonthly: '0' };
      const workingUntil70 = {
        age65: { ...initialAge65(), work: 'yes' as const, workUntil: '70' },
      };

      expect(separateOf(fundPlan, workingUntil70)?.amount).toBeCloseTo(
        separateOf({ ...fundPlan, pensionAgeYears: '70' })?.amount as number,
      );
    });

    it('starts at the current age for someone already past 55', () => {
      expect(separateOf({ thirdPillarPlan: 'fund', birthYear: '1966' })?.start).toBe(60);
    });

    it('follows the contract of the III pillar', () => {
      const once = { ...initialAge66(), thirdPillarContract: 'once' as const };
      const leftAfter = (age66 = initialAge66()) =>
        separateOf({ thirdPillarPlan: 'fund', thirdPillarMonthly: '0' }, { age66 })?.amount;

      expect(separateOf({ thirdPillarPlan: 'fund' }, { age66: once })?.contract).toBe('once');
      expect(leftAfter(once)).not.toBeCloseTo(leftAfter() as number);
    });

    it('ignores the plan where it cannot be used', () => {
      const keeping = separateOf({ thirdPillarPlan: 'keep', thirdPillarJoined: 'after' });

      expect(separateOf({ thirdPillarPlan: 'lump', thirdPillarJoined: 'after' })).toEqual(keeping);
      expect(separateOf({ thirdPillarPlan: 'fund', birthYear: '1950' })).toEqual(
        separateOf({ thirdPillarPlan: 'keep', birthYear: '1950' }),
      );
    });

    it('leaves a smaller pot at the pension age than keeping it, as the money taken is spent', () => {
      const potAtPensionStart = (plan: 'keep' | 'lump' | 'fund') => {
        const result = resultOf(contextWith({ ...saver, thirdPillarPlan: plan }));
        return result.rows.find((row) => row.age === result.pensionStartAge)?.pot as number;
      };

      expect(potAtPensionStart('lump')).toBeLessThan(potAtPensionStart('keep'));
      expect(potAtPensionStart('fund')).toBeLessThan(potAtPensionStart('keep'));
    });
  });

  describe('income at the pension start', () => {
    it('adds up the rounded amounts, so the total matches the lines', () => {
      expect(incomeAtStart({ i1: 600.4, isp: 0, i2: 100.4, i3: 0, dep: 0 }).total).toBe(700);
    });

    it('keeps the state pension line while it has not started yet', () => {
      expect(incomeAtStart({ i1: 0, isp: 0, i2: 300, i3: 0, dep: 0 }).lines).toEqual([
        { id: 'firstPillar', amount: 0 },
        { id: 'secondPillar', amount: 300 },
      ]);
    });
  });

  describe('payout scenario', () => {
    it('keeps growing the money by default', () => {
      expect(resultScenarioOf(contextWith()).id).toBe('E');
    });

    it('takes everything at once when the II pillar is paid out as a lump sum', () => {
      const context = contextWith({}, { age65: { ...initialAge65(), secondPillar: 'lump' } });

      expect(resultScenarioOf(context).id).toBe('A');
    });

    it('takes a fund pension from a yearly or a single contract', () => {
      const age65 = { ...initialAge65(), secondPillar: 'fund' as const };

      expect(resultScenarioOf(contextWith({}, { age65 })).id).toBe('D');
      expect(
        resultScenarioOf(
          contextWith({}, { age65, age66: { ...initialAge66(), secondPillarContract: 'once' } }),
        ).id,
      ).toBe('B');
    });

    it('bridges with the II pillar while the state pension is deferred', () => {
      const age65 = {
        ...initialAge65(),
        secondPillar: 'fund' as const,
        mode: 'defer' as const,
        years: 2,
      };

      expect(resultScenarioOf(contextWith({}, { age65 }))).toMatchObject({
        id: 'C',
        deferral: 2,
      });
    });

    it.each(['defer', 'half'] as const)(
      'leaves out a %s timing chosen before a special pension locked it',
      (mode) => {
        const withSpecialPension = (age65: ReturnType<typeof initialAge65>) =>
          contextWith(
            { workAdded: true, hasSpecialPension: true },
            { specialPension: { ...initialSpecialPension(), monthly: '800' }, age65 },
          );
        const fund = { ...initialAge65(), secondPillar: 'fund' as const };

        expect(resultScenarioOf(withSpecialPension({ ...fund, mode, years: 2 }))).toEqual(
          resultScenarioOf(withSpecialPension(fund)),
        );
      },
    );

    it('takes half of the state pension later when that is chosen', () => {
      const age65 = { ...initialAge65(), mode: 'half' as const, years: 3 };

      expect(resultScenarioOf(contextWith({}, { age65 }))).toMatchObject({ half: 3 });
    });

    it('starts the fund pension at the age chosen after growing the money', () => {
      const age66 = { ...initialAge66(), secondPillarFrom: '70' };

      expect(resultScenarioOf(contextWith({}, { age66 }))).toMatchObject({ id: 'D', fundFrom: 70 });
    });
  });

  describe('result', () => {
    it('carries more every month when there is more saved', () => {
      const little = resultOf(contextWith({ secondPillarAmount: '5000' }));
      const much = resultOf(contextWith({ secondPillarAmount: '90000' }));

      expect(much.sustainable).toBeGreaterThan(little.sustainable);
    });

    it('fails to cover a comfortable life on a small pension, and covers a frugal one', () => {
      const frugal = resultOf(contextWith({ firstPillarMonthly: '900' }));
      const comfortable = resultOf(
        contextWith(
          { firstPillarMonthly: '900' },
          { expenses: withLevel(initialExpenses(), 'comfortable') },
        ),
      );

      expect(frugal.coversNeedUntil).toBeNull();
      expect(comfortable.coversNeedUntil).not.toBeNull();
    });
  });

  describe('coverage kind', () => {
    const covering = (coversNeedUntil: number | null, gapTemporary: boolean) => ({
      ...resultOf(contextWith()),
      pensionStartAge: 65,
      coversNeedUntil,
      gapTemporary,
    });

    it.each([
      { kind: 'all', when: 'nothing ever falls short', result: covering(null, false) },
      { kind: 'gap', when: 'the shortfall ends for good', result: covering(65, true) },
      { kind: 'none', when: 'the shortfall starts with the pension', result: covering(65, false) },
      { kind: 'until', when: 'the shortfall starts later and lasts', result: covering(80, false) },
    ])('is $kind when $when', ({ kind, result }) => {
      expect(coverageKind(result)).toBe(kind);
    });
  });
});
