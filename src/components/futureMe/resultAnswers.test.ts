import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { age55Of, thirdPillarPayout, thirdPillarPayoutInputOf } from './age55';
import { DEPOSIT_REAL_RETURN } from './engine/pension';
import {
  coverageKind,
  incomeAtStart,
  potAtPensionOf,
  resultInputOf,
  resultOf,
  ResultContext,
  resultScenarioOf,
  thirdPillarDepositAtMoneyUseOf,
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
    it('takes the savings, the chosen return and the monthly need from the answers', () => {
      const input = resultInputOf(
        contextWith({ secondPillarAmount: '25000', secondPillarReturnPercent: 4 }),
      );

      expect(input).toMatchObject({ p2: 25000, needMonthly: 791, p1Monthly: 700 });
      expect(input.realReturn).toBeCloseTo(1.04 / 1.02 - 1, 12);
    });

    it('reads the chosen return as before inflation and takes the 2% price growth off it', () => {
      expect(resultInputOf(contextWith({ secondPillarReturnPercent: 2 })).realReturn).toBeCloseTo(
        0,
        12,
      );
      expect(resultInputOf(contextWith()).realReturn).toBeCloseTo(1 / 1.02 - 1, 12);
    });

    it('has no separate III pillar without savings or contributions there', () => {
      expect(resultInputOf(contextWith()).p3Sep).toBeNull();
    });

    it('keeps the III pillar apart with its own fund and the payout chosen for it', () => {
      const context = contextWith(
        { thirdPillarJoined: 'before', thirdPillarAmount: '8000', thirdPillarReturnPercent: -3 },
        { age65: { ...initialAge65(), thirdPillar: 'lump' } },
      );

      const input = resultInputOf(context);

      expect(input.p3Sep).toMatchObject({ amount: 8000, mode: 'lump' });
      expect(input.realReturn3).toBeCloseTo(0.97 / 1.02 - 1, 12);
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
          contextWith({ thirdPillarJoined: 'plan', thirdPillarMonthly: '100', thirdPillarOpenAge }),
        ).p3Sep?.amount as number;

      expect(openingAt('50')).toBeLessThan(0);
      expect(openingAt('60')).toBeLessThan(openingAt('50'));
    });

    it('leaves the III pillar out for a saver who does not plan to join, even with a payment typed before', () => {
      const input = resultInputOf(
        contextWith({
          thirdPillarJoined: 'never',
          thirdPillarMonthly: '100',
          thirdPillarOpenAge: '50',
        }),
      );

      expect(input.p3Monthly).toBe(0);
      expect(input.p3Sep).toBeNull();
    });
  });

  describe('with the III pillar plan chosen at 55', () => {
    const saver = {
      thirdPillarJoined: 'before' as const,
      thirdPillarAmount: '8000',
      thirdPillarMonthly: '100',
      thirdPillarReturnPercent: 2,
    };
    const separateOf = (changes: Parameters<typeof contextWith>[0], rest = {}) =>
      resultInputOf(contextWith({ ...saver, ...changes }, rest)).p3Sep;

    describe('the III pillar on the deposit when the saver starts living off the money', () => {
      const lumpSaver = { ...saver, thirdPillarPlan: 'lump' as const, thirdPillarMonthly: '0' };
      const workingTo74 = { age65: { ...initialAge65(), work: 'yes' as const, workUntil: '74' } };

      it('is what the bar shows on the deposit when nothing else goes there', () => {
        const context = contextWith(lumpSaver);
        const { age, deposit } = potAtPensionOf(context);

        expect(thirdPillarDepositAtMoneyUseOf(context)).toEqual({
          age,
          amount: expect.closeTo(deposit, 6),
        });
      });

      it('is valued at the age the work ends, like the bar, and is worth less by then', () => {
        const atPensionAge = thirdPillarDepositAtMoneyUseOf(contextWith(lumpSaver));
        const atWorkEnd = thirdPillarDepositAtMoneyUseOf(contextWith(lumpSaver, workingTo74));

        expect(atWorkEnd.age).toBe(74);
        expect(potAtPensionOf(contextWith(lumpSaver, workingTo74)).age).toBe(74);
        expect(atWorkEnd.amount).toBeLessThan(atPensionAge.amount);
      });
    });

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

    it('lasts until the age chosen for one contract', () => {
      const until95 = {
        ...initialAge66(),
        thirdPillarContract: 'once' as const,
        thirdPillarEndAge: '95',
      };
      const fundPlan = { ...saver, thirdPillarPlan: 'fund' as const };
      const byAverage = resultOf(
        contextWith(fundPlan, { age66: { ...until95, thirdPillarEndAge: '' } }),
      );
      const result = resultOf(contextWith(fundPlan, { age66: until95 }));

      expect(result.fundPensionContracts.third).toEqual({ start: 55, end: 95 });
      expect(result.earlyThirdPillar[0].amount).toBeLessThan(byAverage.earlyThirdPillar[0].amount);
    });

    it('ignores the plan where it cannot be used', () => {
      const keeping = separateOf({ thirdPillarPlan: 'keep', thirdPillarJoined: 'after' });

      expect(separateOf({ thirdPillarPlan: 'lump', thirdPillarJoined: 'after' })).toEqual(keeping);
      expect(separateOf({ thirdPillarPlan: 'fund', birthYear: '1950' })).toEqual(
        separateOf({ thirdPillarPlan: 'keep', birthYear: '1950' }),
      );
    });

    it('lists the monthly fund pension paid before the pension age', () => {
      const result = resultOf(contextWith({ ...saver, thirdPillarPlan: 'fund' }));

      expect(result.earlyThirdPillar.map(({ age }) => age)).toEqual(
        Array.from({ length: result.pensionStartAge - 55 }, (_, offset) => 55 + offset),
      );
      expect(result.earlyThirdPillar[0].amount).toBeGreaterThan(0);
    });

    it('lists no fund pension before the pension age when the savings are kept or taken at once', () => {
      expect(resultOf(contextWith({ ...saver, thirdPillarPlan: 'keep' })).earlyThirdPillar).toEqual(
        [],
      );
      expect(resultOf(contextWith({ ...saver, thirdPillarPlan: 'lump' })).earlyThirdPillar).toEqual(
        [],
      );
    });

    it('lists the fund pension until work ends while working past the pension age', () => {
      const result = resultOf(
        contextWith(
          { ...saver, thirdPillarPlan: 'fund' },
          { age65: { ...initialAge65(), work: 'yes' as const, workUntil: '70' } },
        ),
      );

      expect(result.earlyThirdPillar.map(({ age }) => age)).toEqual(
        Array.from({ length: 70 - 55 }, (_, offset) => 55 + offset),
      );
    });

    it('leaves a smaller pot at the pension age than keeping it, as the money taken moves to the deposit', () => {
      const atPensionStart = (plan: 'keep' | 'lump' | 'fund') => {
        const result = resultOf(contextWith({ ...saver, thirdPillarPlan: plan }));
        return result.rows.find((row) => row.age === result.pensionStartAge);
      };

      expect(atPensionStart('lump')?.pot).toBeLessThan(atPensionStart('keep')?.pot as number);
      expect(atPensionStart('fund')?.pot).toBeLessThan(atPensionStart('keep')?.pot as number);
      expect(atPensionStart('lump')?.deposit).toBeGreaterThan(
        atPensionStart('keep')?.deposit as number,
      );
      expect(atPensionStart('fund')?.deposit).toBeGreaterThan(
        atPensionStart('keep')?.deposit as number,
      );
    });

    describe('money taken before the pension age', () => {
      const withoutContributions = { ...saver, thirdPillarMonthly: '0' };
      const depositOf = (plan: 'keep' | 'lump' | 'fund') =>
        resultInputOf(contextWith({ ...withoutContributions, thirdPillarPlan: plan }))
          .extraDeposit ?? 0;
      const payoutOf = (plan: 'lump' | 'fund') => {
        const { you } = contextWith({ ...withoutContributions, thirdPillarPlan: plan });
        return thirdPillarPayout(plan, thirdPillarPayoutInputOf(you, 1, 'yearly'));
      };
      const atRetirement = (amount: number, age: number) =>
        amount * (1 + DEPOSIT_REAL_RETURN) ** (65 - age);

      it('puts nothing on the deposit while the savings keep growing', () => {
        expect(depositOf('keep')).toBe(0);
      });

      it('puts the money taken at once at 55 on the deposit after tax, losing value until retirement', () => {
        expect(depositOf('lump')).toBeCloseTo(atRetirement(payoutOf('lump')?.net as number, 55));
      });

      it('puts each fund pension payment on the deposit, losing value until retirement', () => {
        const paid = (payoutOf('fund')?.monthly ?? []).reduce(
          (sum, { age, amount }) => sum + atRetirement(amount * 12, age),
          0,
        );

        expect(paid).toBeGreaterThan(0);
        expect(depositOf('fund')).toBeCloseTo(paid);
      });
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

  describe('payout chosen five years before the pension age', () => {
    it.each(['fund', 'lump'] as const)(
      'starts the %s payout five years before the pension age',
      (secondPillar) => {
        const context = contextWith({}, { age60: { ...initialAge60(), secondPillar } });

        expect(resultInputOf(context).p2PayoutFrom).toBe(60);
      },
    );

    it('leaves the start to the pension age while the money keeps growing', () => {
      expect(resultInputOf(contextWith()).p2PayoutFrom).toBeUndefined();
    });

    describe('for the III pillar', () => {
      const saver = {
        thirdPillarJoined: 'after' as const,
        thirdPillarAmount: '5000',
        thirdPillarMonthly: '50',
      };

      it.each(['fund', 'lump'] as const)(
        'starts the %s payout five years before the pension age',
        (thirdPillar) => {
          const context = contextWith(saver, { age60: { ...initialAge60(), thirdPillar } });

          expect(resultInputOf(context).p3PayoutFrom).toBe(60);
        },
      );

      it('leaves the start to the pension age while the money keeps growing', () => {
        expect(resultInputOf(contextWith(saver)).p3PayoutFrom).toBeUndefined();
      });

      it('keeps the fund pension started at 55', () => {
        const context = contextWith(
          { ...saver, thirdPillarJoined: 'before', thirdPillarPlan: 'fund' },
          { age60: { ...initialAge60(), thirdPillar: 'lump' } },
        );

        expect(resultInputOf(context).p3PayoutFrom).toBeUndefined();
      });

      it('leaves nothing in the III pillar at the pension age when taken at once at 55 and at 60', () => {
        const potAtPensionAge = (changes: Parameters<typeof contextWith>[0], rest = {}) =>
          resultOf(contextWith({ ...saver, ...changes }, rest)).rows.find(({ age }) => age === 65)
            ?.pot;
        const withoutThirdPillar = potAtPensionAge({
          thirdPillarAmount: '0',
          thirdPillarMonthly: '0',
        });

        expect(
          potAtPensionAge(
            { thirdPillarJoined: 'before', thirdPillarPlan: 'lump' },
            { age60: { ...initialAge60(), thirdPillar: 'lump' } },
          ),
        ).toBeCloseTo(withoutThirdPillar as number);
      });
    });

    it('has the money taken while working on the deposit at the pension age', () => {
      const context = contextWith({}, { age60: { ...initialAge60(), secondPillar: 'fund' } });
      const atPensionAge = resultOf(context).rows.find(({ age }) => age === 65);

      expect(atPensionAge?.deposit).toBeGreaterThan(0);
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

    it('lasts until the age chosen for one contract', () => {
      const age65 = { ...initialAge65(), secondPillar: 'fund' as const };
      const scenarioWith = (changes: Partial<ReturnType<typeof initialAge66>>) =>
        resultScenarioOf(contextWith({}, { age65, age66: { ...initialAge66(), ...changes } }));

      expect(scenarioWith({ secondPillarContract: 'once', secondPillarEndAge: '95' }).endAge).toBe(
        95,
      );
      expect(scenarioWith({ secondPillarContract: 'once' }).endAge).toBeUndefined();
      expect(
        scenarioWith({ secondPillarContract: 'once', secondPillarEndAge: '70' }).endAge,
      ).toBeUndefined();
      expect(scenarioWith({ secondPillarEndAge: '95' }).endAge).toBeUndefined();
    });

    it('lasts until the age chosen for one III pillar contract at the pension age', () => {
      const age65 = { ...initialAge65(), thirdPillar: 'fund' as const };
      const age66 = {
        ...initialAge66(),
        thirdPillarContract: 'once' as const,
        thirdPillarEndAge: '95',
      };
      const context = contextWith({ thirdPillarAmount: '8000' }, { age65, age66 });

      expect(resultInputOf(context).p3Sep?.endAge).toBe(95);
      expect(resultOf(context).fundPensionContracts.third?.end).toBe(95);
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

describe('civil service years in the result', () => {
  const civilServant = (civilYears: string, changes = {}) =>
    contextWith({ workAdded: true, isCivilServant: true, civilYears, ...changes });
  const statePensionAtStart = (context: ResultContext): number => {
    const result = resultOf(context);
    return result.rows.find(({ age }) => age === result.pensionStartAge)?.i1g ?? 0;
  };

  it('give the engine the civil service years once the saver ticks the civil servant', () => {
    expect(resultInputOf(civilServant('20')).civilYears).toBe(20);
    expect(resultInputOf(civilServant('20', { isCivilServant: false })).civilYears).toBe(0);
    expect(resultInputOf(civilServant('20', { workAdded: false })).civilYears).toBe(0);
  });

  it('raise the state pension by the civil service increase', () => {
    expect(statePensionAtStart(civilServant('20'))).toBeCloseTo(
      statePensionAtStart(civilServant('0')) * 1.2,
      6,
    );
  });

  describe('with rescue service years', () => {
    const retiringBy2042 = { birthYear: '1970' };
    const alsoRescuer = (rescueYears: string, changes = {}) =>
      civilServant('20', { hasRescue: true, rescueYears, ...changes });

    it('raise the state pension by the rescue increase alone while it applies', () => {
      expect(statePensionAtStart(alsoRescuer('12', retiringBy2042))).toBeCloseTo(
        statePensionAtStart(civilServant('0', retiringBy2042)) * 1.1,
        6,
      );
    });

    it('leave the state pension unraised when the rescue years are too few for the rescue increase', () => {
      expect(statePensionAtStart(alsoRescuer('5', retiringBy2042))).toBeCloseTo(
        statePensionAtStart(civilServant('0', retiringBy2042)),
        6,
      );
    });

    it('leave the state pension unraised when the rescue increase has ended by the pension year', () => {
      expect(statePensionAtStart(alsoRescuer('12'))).toBeCloseTo(
        statePensionAtStart(civilServant('0')),
        6,
      );
    });
  });
});

describe('birth month in the result', () => {
  it('gives the engine the month the saver was born in', () => {
    expect(resultInputOf(contextWith({ birthMonth: 6 })).birthMonth).toBe(6);
    expect(resultInputOf(contextWith({ birthMonth: null })).birthMonth).toBeUndefined();
  });
});
