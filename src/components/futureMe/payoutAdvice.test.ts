import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, withLevel } from './expensesAnswers';
import {
  deferralChanges,
  HowTo,
  howToChoose,
  payoutWarningOf,
  stepToChoose,
  surplusTipOf,
} from './payoutAdvice';
import { FutureMeStep } from './steps';
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

const followed = (context: ResultContext, how: HowTo): ResultContext => {
  const { age60, age65, age66 } = context;
  const fundAt = how.atPayoutAge
    ? { age60: { ...age60, secondPillar: 'fund' as const }, age65 }
    : { age60, age65: { ...age65, secondPillar: 'fund' as const } };
  switch (how.kind) {
    case 'lump':
      return { ...context, age60: { ...age60, secondPillar: 'lump' } };
    case 'grow':
      return {
        ...context,
        age60: { ...age60, secondPillar: 'grow' },
        age65: { ...age65, secondPillar: 'grow' },
      };
    case 'contract':
      return { ...context, age66: { ...age66, secondPillarContract: how.contract } };
    case 'bridge':
      return {
        ...context,
        ...fundAt,
        age65: { ...fundAt.age65, mode: 'defer', years: how.deferral },
      };
    default:
      return {
        ...context,
        ...fundAt,
        age65: { ...fundAt.age65, mode: 'full' },
        age66: { ...age66, secondPillarContract: how.contract },
      };
  }
};

describe('payoutAdvice', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });
  afterAll(() => jest.useRealTimers());

  describe('advice that following it gives what it promises', () => {
    it.each([
      {
        chosen: 'a lump sum at the pension age',
        context: contextWith(
          {},
          { ...comfortable, age65: { ...initialAge65(), secondPillar: 'lump' } },
        ),
      },
      {
        chosen: 'one fund pension contract',
        context: contextWith(
          { secondPillarAmount: '100000' },
          {
            ...comfortable,
            age65: fundPension,
            age66: { ...initialAge66(), secondPillarContract: 'once' },
          },
        ),
      },
      {
        chosen: 'half of the state pension for five years',
        context: contextWith(
          { secondPillarAmount: '20000', firstPillarMonthly: '500' },
          { age65: { ...fundPension, mode: 'half', years: 5 } },
        ),
      },
    ])('promises what following it carries after $chosen', ({ context }) => {
      const warning = warningFor(context);
      if (warning?.kind !== 'betterPayout') {
        throw new Error(`Expected a better payout, got ${JSON.stringify(warning)}`);
      }

      expect(resultOf(followed(context, warning.how)).sustainable).toBe(warning.best);
    });
  });

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
    it('takes the lump sum at the payout age', () => {
      expect(howToChoose({ id: 'A' }, contextWith())).toMatchObject({
        kind: 'lump',
        payoutAge: 60,
      });
    });

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

  describe('the step where a payout is chosen', () => {
    const how = (changes: Partial<HowTo>): HowTo => ({
      kind: 'fund',
      contract: 'once',
      deferral: 0,
      atPayoutAge: false,
      payoutAge: 60,
      ...changes,
    });

    it('is the payout age step when the choice is made there', () => {
      expect(stepToChoose(how({ atPayoutAge: true }))).toBe(FutureMeStep.AGE_60);
    });

    it('is the pension age step otherwise', () => {
      expect(stepToChoose(how({}))).toBe(FutureMeStep.AGE_65);
    });

    it('is the pension years step when only the contract changes', () => {
      expect(stepToChoose(how({ kind: 'contract', atPayoutAge: true }))).toBe(
        FutureMeStep.AGE_66_PLUS,
      );
    });
  });

  describe('changing the state pension deferral', () => {
    it('takes the state pension at once when no deferral carries', () => {
      const context = contextWith({}, { age65: deferredFive });

      expect(deferralChanges(context, 0).age65).toMatchObject({ mode: 'full' });
    });

    it('defers it by the shorter number of years', () => {
      const context = contextWith({}, { age65: deferredFive });

      expect(deferralChanges(context, 2).age65).toMatchObject({
        mode: 'defer',
        years: 2,
        secondPillar: 'fund',
      });
    });
  });

  describe('surplus tip', () => {
    it('stays away without a fund pension', () => {
      expect(tipFor(contextWith())).toBeNull();
    });

    it('stays away when the fund pension pays no more than the costs', () => {
      expect(tipFor(contextWith({}, { ...comfortable, age65: fundPension }))).toBeNull();
    });

    it('tells how much the fund pension pays over the costs and what growing would carry', () => {
      const context = contextWith(
        { secondPillarAmount: '150000', firstPillarMonthly: '900' },
        { age65: fundPension, age66: { ...initialAge66(), secondPillarContract: 'once' } },
      );

      expect(tipFor(context)).toMatchObject({
        from: 65,
        grow: 1660,
        mine: 1610,
        decision: 'secondPillarAtPensionAge',
      });
      expect(tipFor(context)?.average).toBeGreaterThan(1000);
    });

    it('keeps the chosen state pension timing in what growing would carry', () => {
      const context = contextWith(
        { secondPillarAmount: '100000', firstPillarMonthly: '900' },
        {
          age65: { ...fundPension, mode: 'defer', years: 2 },
          age66: { ...initialAge66(), secondPillarContract: 'once' },
        },
      );
      const growing = {
        ...context,
        age65: { ...context.age65, secondPillar: 'grow' as const },
      };

      expect(tipFor(context)?.grow).toBe(resultOf(growing).sustainable);
    });

    it('stays away when only the III pillar pays a fund pension', () => {
      const context = contextWith(
        { thirdPillarJoined: 'after', thirdPillarAmount: '100000', thirdPillarMonthly: '0' },
        {
          age60: { ...initialAge60(), secondPillar: 'lump' },
          age65: { ...initialAge65(), thirdPillar: 'fund' },
        },
      );

      expect(tipFor(context)).toBeNull();
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
