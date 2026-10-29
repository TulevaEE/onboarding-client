import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { coversAgeOf, decisionsOf, withDecision } from './decisions';
import { initialExpenses } from './expensesAnswers';
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

const idsOf = (context: ResultContext) => decisionsOf(context).map(({ id }) => id);

const fundPensionOf = (context: ResultContext) =>
  decisionsOf(context).find(({ id }) => id === 'fundPension');

const withThirdPillar = { thirdPillarMonthly: '50', thirdPillarAmount: '5000' };

const fundAt = (pillar: 'secondPillar' | 'thirdPillar') => ({
  ...initialAge60(),
  [pillar]: 'fund' as const,
});

const PAID_FROM = 0.5;

describe('decisions', () => {
  describe('which decisions the answers ask for', () => {
    it('asks about the II pillar and the state pension when there is no III pillar', () => {
      expect(idsOf(contextWith())).toEqual([
        'secondPillarAtPayoutAge',
        'statePension',
        'secondPillarAtPensionAge',
        'fundPension',
      ]);
    });

    it('opens the payout decision 5 years before the pension age and the pension decision at it', () => {
      expect(decisionsOf(contextWith())).toMatchObject([
        { id: 'secondPillarAtPayoutAge', age: 60, year: 2040, current: 'grow' },
        { id: 'statePension', age: 65, year: 2045, current: 'full' },
        { id: 'secondPillarAtPensionAge', age: 65, year: 2045, current: 'grow' },
        { id: 'fundPension', age: 66, year: 2046 },
      ]);
    });

    it('offers the same three ways to take a pillar out at both ages', () => {
      const [payout, , pension] = decisionsOf(contextWith());

      expect(payout.choices).toEqual(['grow', 'fund', 'lump']);
      expect(pension.choices).toEqual(['grow', 'fund', 'lump']);
    });

    it('offers the state pension in full, half or deferred', () => {
      const [, statePension] = decisionsOf(contextWith());

      expect(statePension.choices).toEqual(['full', 'half', 'defer']);
    });

    it('does not ask about the II pillar without savings there', () => {
      const without = contextWith({ secondPillarAmount: '', secondPillarRate: '0' });

      expect(idsOf(without)).toEqual(['statePension']);
    });

    it('asks about the III pillar once there is money or a contribution in it', () => {
      const withThird = contextWith(withThirdPillar);

      expect(idsOf(withThird)).toEqual([
        'secondPillarAtPayoutAge',
        'thirdPillarAtPayoutAge',
        'statePension',
        'secondPillarAtPensionAge',
        'thirdPillarAtPensionAge',
        'fundPension',
      ]);
    });

    it('asks about a pillar at the pension age only when it was left to grow at the earlier age', () => {
      const lumpedAt60 = contextWith({}, { age60: { ...initialAge60(), secondPillar: 'lump' } });

      expect(idsOf(lumpedAt60)).toEqual(['secondPillarAtPayoutAge', 'statePension']);
    });

    it('does not offer to postpone the state pension next to a special pension', () => {
      const withSpecialPension = contextWith({ workAdded: true, hasSpecialPension: true });

      expect(idsOf(withSpecialPension)).not.toContain('statePension');
    });

    it('lists the special pension at its start age, before the decisions that open later', () => {
      const withSpecialPension = contextWith(
        { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55' },
        { specialPension: { ...initialSpecialPension(), monthly: '900' } },
      );

      expect(decisionsOf(withSpecialPension)[0]).toMatchObject({
        id: 'specialPension',
        age: 55,
        choices: [],
        summary: { hasMonthly: 'yes' },
      });
    });

    it('says the special pension amount is missing until it is typed', () => {
      const withSpecialPension = contextWith({ workAdded: true, hasSpecialPension: true });

      expect(
        decisionsOf(withSpecialPension).find(({ id }) => id === 'specialPension')?.summary,
      ).toMatchObject({ hasMonthly: 'no' });
    });

    it('asks about the fund pension start while a pillar is left to grow', () => {
      const fundPension = decisionsOf(contextWith()).find(({ id }) => id === 'fundPension');

      expect(fundPension).toMatchObject({ age: 66, summary: { starts: 'none' } });
    });

    it('shows the earliest fund pension start picked', () => {
      const startsAt70 = contextWith({}, { age66: { ...initialAge66(), secondPillarFrom: '70' } });

      expect(fundPensionOf(startsAt70)).toMatchObject({
        age: 70,
        year: 2050,
        summary: { starts: 'second', secondPillarAge: 70 },
      });
    });

    it('starts a fund pension chosen at the payout age at the pension age, as the calculation pays it', () => {
      const fundAt60 = contextWith({}, { age60: { ...initialAge60(), secondPillar: 'fund' } });

      expect(fundPensionOf(fundAt60)).toMatchObject({
        age: 65,
        year: 2045,
        summary: { starts: 'second', secondPillarAge: 65 },
      });
    });

    it('counts a fund pension chosen at the pension age while the III pillar is left to grow', () => {
      const fundAtPensionAge = contextWith(withThirdPillar, {
        age65: { ...initialAge65(), secondPillar: 'fund' },
      });

      expect(fundPensionOf(fundAtPensionAge)).toMatchObject({
        age: 65,
        summary: { starts: 'second', secondPillarAge: 65 },
      });
    });

    it('names the start of each pillar when both pay a fund pension', () => {
      const bothStart = contextWith(withThirdPillar, {
        age65: { ...initialAge65(), secondPillar: 'fund' },
        age66: { ...initialAge66(), thirdPillarFrom: '70' },
      });

      expect(fundPensionOf(bothStart)).toMatchObject({
        age: 65,
        summary: { starts: 'both', secondPillarAge: 65, thirdPillarAge: 70 },
      });
    });

    it('starts the fund pension once the work kept on after the pension age ends', () => {
      const workingUntil68 = contextWith(
        {},
        { age65: { ...initialAge65(), secondPillar: 'fund', work: 'yes', workUntil: '68' } },
      );

      expect(fundPensionOf(workingUntil68)).toMatchObject({
        age: 68,
        summary: { starts: 'second', secondPillarAge: 68 },
      });
    });

    it.each([
      ['a II pillar fund pension chosen at the payout age', {}, { age60: fundAt('secondPillar') }],
      [
        'a III pillar fund pension chosen at the payout age',
        withThirdPillar,
        { age60: fundAt('thirdPillar') },
      ],
      [
        'a II pillar fund pension chosen at the pension age',
        withThirdPillar,
        { age65: { ...initialAge65(), secondPillar: 'fund' as const } },
      ],
      [
        'a picked start while working on',
        {},
        {
          age65: { ...initialAge65(), work: 'yes' as const, workUntil: '68' },
          age66: { ...initialAge66(), secondPillarFrom: '66' },
        },
      ],
    ])('lists %s at the age the calculation pays it from', (_, you, rest) => {
      const context = contextWith(you, rest);
      const result = resultOf(context);
      const firstPayment = result.rows.find(
        ({ age, fp }) => age >= result.pensionStartAge && fp > PAID_FROM,
      );

      expect(fundPensionOf(context)?.age).toBe(firstPayment?.age);
    });
  });

  describe('changing a decision', () => {
    it('leaves the answers to the step the special pension and fund pension open', () => {
      expect(withDecision(contextWith(), 'fundPension', '')).toEqual({});
    });

    it('changes how the II pillar is taken out at the payout age', () => {
      const changes = withDecision(contextWith(), 'secondPillarAtPayoutAge', 'lump');

      expect(changes).toEqual({ age60: { secondPillar: 'lump', thirdPillar: 'grow' } });
    });

    it('changes how the III pillar is taken out at the pension age', () => {
      const changes = withDecision(contextWith(), 'thirdPillarAtPensionAge', 'fund');

      expect(changes.age65).toMatchObject({ thirdPillar: 'fund', secondPillar: 'grow' });
    });

    it('changes when the state pension is taken', () => {
      const changes = withDecision(contextWith(), 'statePension', 'defer');

      expect(changes.age65).toMatchObject({ mode: 'defer', years: 1 });
    });
  });

  describe('how long the money lasts', () => {
    it('is the age the costs stop being covered at', () => {
      const result = { ...resultOf(contextWith()), coversNeedUntil: 83 };

      expect(coversAgeOf(result)).toBe(83);
    });

    it('is 100 when the costs are covered for life', () => {
      const result = { ...resultOf(contextWith()), coversNeedUntil: null };

      expect(coversAgeOf(result)).toBe(100);
    });
  });
});
