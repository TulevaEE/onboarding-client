import { retirementYears } from './engine/pension';
import { ageTense, hasReachedAge, hasThirdPillarAt, payoutAge, retirementAge } from './planAges';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const youWith = (changes: Partial<ReturnType<typeof initialAnswers>>) => ({
  ...initialAnswers(noPrefill),
  ...changes,
});
const planAt65 = (changes: Partial<ReturnType<typeof initialAnswers>> = {}) =>
  toStepPlanInput(youWith({ pensionAgeYears: '65', ...changes }));

const FIVE_CHILDREN = {
  kidsAdded: true,
  kidsCount: '5',
  kidsBirthYears: ['1990', '1992', '1994', '1996', '1998'],
  kidsEarlyUser: 'me' as const,
};

describe('planAges', () => {
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
      expect(ageTense(1960, 60)).toBe('past');
      expect(ageTense(1966, 60)).toBe('present');
      expect(ageTense(1990, 60)).toBe('future');
    });
  });

  describe('retirement age', () => {
    it('is the pension age without any early years', () => {
      expect(retirementAge(planAt65())).toBe(65);
    });

    it('subtracts the early years', () => {
      expect(retirementAge(planAt65(FIVE_CHILDREN))).toBe(60);
      expect(retirementAge(planAt65({ earlyYearsPicked: '2' }))).toBe(63);
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
      expect(hasThirdPillarFor({ thirdPillarJoined: 'plan', thirdPillarAmount: '500' })).toBe(
        false,
      );
      expect(hasThirdPillarFor({ thirdPillarJoined: 'plan', thirdPillarMonthly: '30' })).toBe(true);
    });

    it('is false for a saver who does not plan to join, even with a payment typed before', () => {
      expect(
        hasThirdPillarFor({
          thirdPillarJoined: 'never',
          thirdPillarMonthly: '30',
          thirdPillarAmount: '500',
        }),
      ).toBe(false);
    });

    it('is false when the saver opens the III pillar only after the payout age', () => {
      expect(
        hasThirdPillarFor({
          thirdPillarJoined: 'plan',
          thirdPillarMonthly: '30',
          thirdPillarOpenAge: '65',
        }),
      ).toBe(false);
    });

    it('counts a pillar opened after the payout age when asked at the pension age', () => {
      const you = youWith({
        thirdPillarJoined: 'plan',
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
          thirdPillarJoined: 'plan',
          thirdPillarMonthly: '30',
          thirdPillarOpenAge: '50',
        }),
      ).toBe(true);
    });
  });
});

describe('whether the saver has reached an age by a date', () => {
  const midOctober2026 = new Date(2026, 9, 15);

  it('counts the birth month', () => {
    expect(hasReachedAge({ birthYear: 1961, birthMonth: 12 }, 65, midOctober2026)).toBe(false);
    expect(hasReachedAge({ birthYear: 1961, birthMonth: 10 }, 65, midOctober2026)).toBe(true);
    expect(hasReachedAge({ birthYear: 1961, birthMonth: 1 }, 65, midOctober2026)).toBe(true);
  });

  it('takes January when the birth month is not known', () => {
    expect(hasReachedAge({ birthYear: 1961 }, 65, midOctober2026)).toBe(true);
    expect(hasReachedAge({ birthYear: 1962 }, 65, midOctober2026)).toBe(false);
  });
});
