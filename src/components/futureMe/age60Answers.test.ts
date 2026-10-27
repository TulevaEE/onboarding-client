import {
  decisionOrdinal,
  hasThirdPillar,
  initialAge60,
  payoutAge,
  payoutAgeTense,
} from './age60Answers';
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
    it('is true with a balance or a monthly payment once joined', () => {
      expect(
        hasThirdPillar(youWith({ thirdPillarJoined: 'after', thirdPillarAmount: '100' })),
      ).toBe(true);
      expect(
        hasThirdPillar(youWith({ thirdPillarJoined: 'before', thirdPillarMonthly: '20' })),
      ).toBe(true);
    });

    it('is false when joined with nothing in it', () => {
      expect(hasThirdPillar(youWith({ thirdPillarJoined: 'after' }))).toBe(false);
    });

    it('counts only the monthly payment when not joined yet, because the balance is ignored', () => {
      expect(hasThirdPillar(youWith({ thirdPillarJoined: 'none', thirdPillarAmount: '500' }))).toBe(
        false,
      );
      expect(hasThirdPillar(youWith({ thirdPillarJoined: 'none', thirdPillarMonthly: '30' }))).toBe(
        true,
      );
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
  });
});
