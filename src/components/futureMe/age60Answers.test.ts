import {
  decisionOrdinal,
  hasThirdPillarAt,
  initialAge60,
  payoutAge,
  payoutAgeTense,
} from './age60Answers';
import { retirementYears } from './engine/pension';
import { FutureMeStep } from './steps';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const youWith = (changes: Partial<ReturnType<typeof initialAnswers>>) => ({
  ...initialAnswers(noPrefill),
  ...changes,
});

describe('age60Answers', () => {
  it('starts with growing both pillars', () => {
    expect(initialAge60()).toEqual({ secondPillar: 'grow', thirdPillar: 'grow' });
  });

  describe('payout age', () => {
    it('is five years before the pension age', () => {
      expect(payoutAge(toStepPlanInput(youWith({ pensionAgeYears: '67' })))).toBe(62);
    });

    it('ignores retiring early, which has its own step', () => {
      const early = youWith({
        pensionAgeYears: '65',
        earlyYearsPicked: '2',
        kidsAdded: true,
        kidsCount: '3',
        kidsBirthYears: ['2000', '2002', '2004'],
      });

      expect(payoutAge(toStepPlanInput(early))).toBe(
        payoutAge(toStepPlanInput(youWith({ pensionAgeYears: '65' }))),
      );
    });

    it('is in the past, present or future relative to today', () => {
      expect(payoutAgeTense(1960, 60)).toBe('past');
      expect(payoutAgeTense(1966, 60)).toBe('present');
      expect(payoutAgeTense(1990, 60)).toBe('future');
    });
  });

  describe('having a third pillar', () => {
    const hasThirdPillarFor = (changes: Partial<ReturnType<typeof initialAnswers>>) => {
      const you = youWith(changes);
      const plan = toStepPlanInput(you);
      return hasThirdPillarAt(you, plan, payoutAge(plan));
    };

    it('is true with a balance or a monthly payment once joined', () => {
      expect(hasThirdPillarFor({ thirdPillarJoined: 'after', thirdPillarAmount: '100' })).toBe(
        true,
      );
      expect(hasThirdPillarFor({ thirdPillarJoined: 'before', thirdPillarMonthly: '20' })).toBe(
        true,
      );
    });

    it('is false when joined with nothing in it', () => {
      expect(hasThirdPillarFor({ thirdPillarJoined: 'after' })).toBe(false);
    });

    it('counts only the monthly payment when not joined yet, because the balance is ignored', () => {
      expect(hasThirdPillarFor({ thirdPillarJoined: 'none', thirdPillarAmount: '500' })).toBe(
        false,
      );
      expect(hasThirdPillarFor({ thirdPillarJoined: 'none', thirdPillarMonthly: '30' })).toBe(true);
    });

    it('is false when the saver opens the III pillar only after the payout age', () => {
      expect(
        hasThirdPillarFor({
          thirdPillarJoined: 'none',
          thirdPillarMonthly: '30',
          thirdPillarOpenAge: '65',
        }),
      ).toBe(false);
    });

    it('counts a pillar opened after the payout age when asked at the pension age', () => {
      const you = youWith({
        thirdPillarJoined: 'none',
        thirdPillarMonthly: '30',
        thirdPillarOpenAge: '63',
      });
      const plan = toStepPlanInput(you);

      expect(hasThirdPillarAt(you, plan, payoutAge(plan))).toBe(false);
      expect(hasThirdPillarAt(you, plan, retirementYears(plan))).toBe(true);
    });

    it('is true when the saver opens the III pillar before the payout age', () => {
      expect(
        hasThirdPillarFor({
          thirdPillarJoined: 'none',
          thirdPillarMonthly: '30',
          thirdPillarOpenAge: '50',
        }),
      ).toBe(true);
    });
  });

  describe('decision ordinal', () => {
    it('is first when the age 55 step is not shown', () => {
      expect(decisionOrdinal([FutureMeStep.YOU, FutureMeStep.AGE_60])).toBe('first');
    });

    it('is second after the age 55 decision', () => {
      expect(decisionOrdinal([FutureMeStep.YOU, FutureMeStep.AGE_55, FutureMeStep.AGE_60])).toBe(
        'second',
      );
    });

    it('is second after the early withdrawal decision', () => {
      expect(
        decisionOrdinal([FutureMeStep.YOU, FutureMeStep.EARLY_WITHDRAWAL, FutureMeStep.AGE_60]),
      ).toBe('second');
    });

    it('is third after both the early withdrawal and the age 55 decisions', () => {
      expect(
        decisionOrdinal([
          FutureMeStep.YOU,
          FutureMeStep.EARLY_WITHDRAWAL,
          FutureMeStep.AGE_55,
          FutureMeStep.AGE_60,
        ]),
      ).toBe('third');
    });
  });
});
