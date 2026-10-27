import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { resultInputOf, resultOf, ResultContext, resultScenarioOf } from './resultAnswers';
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
});
