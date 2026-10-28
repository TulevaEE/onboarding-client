import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import { howToChoose, payoutWarningOf, surplusTipOf } from './payoutAdvice';
import { ResultContext, resultOf } from './resultAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
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

const comfortable = { expenses: withLevel(initialExpenses(), 'comfortable') };
const fundPension = { ...initialAge65(), secondPillar: 'fund' as const };
const deferredFive = { ...fundPension, mode: 'defer' as const, years: 5 };

const warningFor = (context: ResultContext) => payoutWarningOf(context, resultOf(context));
const tipFor = (context: ResultContext) => surplusTipOf(context, resultOf(context));

describe('payoutAdvice', () => {
  describe('warning', () => {
    it('stays away while the costs are covered for life', () => {
      expect(warningFor(contextWith())).toBeNull();
    });

    it('offers the payout that carries the most when the chosen one runs short', () => {
      const context = contextWith(
        {},
        { ...comfortable, age65: { ...initialAge65(), secondPillar: 'lump' } },
      );

      expect(warningFor(context)).toEqual({
        kind: 'betterPayout',
        until: 71,
        scenarioId: 'C',
        best: 900,
        mine: 790,
        how: { kind: 'bridge', deferral: 2, contract: 'yearly', atPayoutAge: false, payoutAge: 60 },
      });
    });

    it('offers a shorter deferral when the pillars cannot bridge the chosen one', () => {
      const context = contextWith({ secondPillarAmount: '5000' }, { age65: deferredFive });

      expect(warningFor(context)).toMatchObject({
        kind: 'shorterDeferral',
        deferral: 5,
        shorter: 4,
        pensionAge: 65,
      });
    });

    it('says that no payout carries the costs when the chosen one is already the best', () => {
      const context = contextWith(
        { secondPillarAmount: '20000' },
        { ...comfortable, age65: deferredFive },
      );

      expect(warningFor(context)).toEqual({ kind: 'noPayoutCovers', until: 69, most: 1010 });
    });

    it('does not offer a deferred state pension next to a special pension', () => {
      const context = contextWith(
        { hasSpecialPension: true, workAdded: true, specialPensionStartAge: '55' },
        {
          ...comfortable,
          age65: { ...initialAge65(), secondPillar: 'lump' },
          specialPension: { ...initialSpecialPension(), monthly: '300' },
        },
      );

      const warning = warningFor(context);

      expect(warning?.kind).toBe('betterPayout');
      expect(warning).not.toMatchObject({ scenarioId: 'C' });
    });
  });

  describe('how to choose a payout', () => {
    it('keeps growing from the payout age on', () => {
      expect(howToChoose({ id: 'E' }, contextWith())).toMatchObject({
        kind: 'grow',
        payoutAge: 60,
      });
    });

    it('only changes the contract when the fund pension is already chosen', () => {
      expect(howToChoose({ id: 'B' }, contextWith({}, { age65: fundPension }))).toMatchObject({
        kind: 'contract',
        contract: 'once',
      });
    });

    it('chooses the fund pension where the payout was chosen', () => {
      const context = contextWith({}, { age60: { ...initialAge60(), secondPillar: 'lump' } });

      expect(howToChoose({ id: 'D' }, context)).toMatchObject({
        kind: 'fund',
        contract: 'yearly',
        atPayoutAge: true,
      });
    });
  });

  describe('surplus tip', () => {
    it('stays away without a fund pension', () => {
      expect(tipFor(contextWith())).toBeNull();
    });

    it('tells how much the fund pension pays over the costs and what growing would carry', () => {
      const context = contextWith(
        { secondPillarAmount: '150000', firstPillarMonthly: '900' },
        { age65: fundPension, age66: { ...initialAge66(), secondPillarContract: 'once' } },
      );

      expect(tipFor(context)).toMatchObject({ from: 65, grow: 1660, mine: 1610 });
      expect(tipFor(context)?.average).toBeGreaterThan(1000);
    });

    it('leaves growing out when it would not carry more', () => {
      const context = contextWith(
        { secondPillarAmount: '150000', firstPillarMonthly: '900' },
        { age65: fundPension },
      );

      expect(tipFor(context)).toMatchObject({ from: 65, grow: null });
    });
  });
});
