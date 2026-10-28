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

describe('decisions', () => {
  describe('which decisions the answers ask for', () => {
    it('asks about the II pillar and the state pension when there is no III pillar', () => {
      expect(idsOf(contextWith())).toEqual([
        'secondPillarAtPayoutAge',
        'statePension',
        'secondPillarAtPensionAge',
      ]);
    });

    it('opens the payout decision 5 years before the pension age and the pension decision at it', () => {
      expect(decisionsOf(contextWith())).toMatchObject([
        { id: 'secondPillarAtPayoutAge', age: 60, year: 2040, current: 'grow' },
        { id: 'statePension', age: 65, year: 2045, current: 'full' },
        { id: 'secondPillarAtPensionAge', age: 65, year: 2045, current: 'grow' },
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
      const withThird = contextWith({ thirdPillarMonthly: '50', thirdPillarAmount: '5000' });

      expect(idsOf(withThird)).toEqual([
        'secondPillarAtPayoutAge',
        'thirdPillarAtPayoutAge',
        'statePension',
        'secondPillarAtPensionAge',
        'thirdPillarAtPensionAge',
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
  });

  describe('changing a decision', () => {
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
