import {
  deferralLock,
  deferralYearsWhileWorking,
  deferredMonthly,
  initialAge65,
  isPayoutChoiceMadeAtAnotherStep,
  pensionKind,
  withMode,
  workAccrualMonthly,
  workUntilOf,
  workUntilOptions,
} from './age65Answers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const youWith = (changes: Partial<ReturnType<typeof initialAnswers>>) => ({
  ...initialAnswers(noPrefill),
  pensionAgeYears: '65',
  ...changes,
});
const planOf = (changes: Partial<ReturnType<typeof initialAnswers>> = {}) =>
  toStepPlanInput(youWith(changes));

const FIVE_CHILDREN = {
  kidsAdded: true,
  kidsCount: '5',
  kidsBirthYears: ['1990', '1992', '1994', '1996', '1998'],
  kidsEarlyUser: 'me' as const,
};

describe('age65Answers', () => {
  it('starts with taking the full state pension, not working, and growing both pillars', () => {
    expect(initialAge65()).toEqual({
      work: 'no',
      workUntil: '',
      mode: 'full',
      years: 1,
      secondPillar: 'grow',
      thirdPillar: 'grow',
      firstPillarChoice: null,
    });
  });

  it('keeps the years when switching between half and deferral', () => {
    const deferred = { ...initialAge65(), years: 3 };

    expect(withMode(deferred, 'half')).toMatchObject({ mode: 'half', years: 3 });
    expect(withMode(deferred, 'full')).toMatchObject({ mode: 'full', years: 3 });
  });

  describe('pension kind', () => {
    it('is regular, favourable or flexible', () => {
      expect(pensionKind(youWith({}))).toBe('regular');
      expect(pensionKind(youWith(FIVE_CHILDREN))).toBe('favourable');
      expect(pensionKind(youWith({ earlyYearsPicked: '2' }))).toBe('flexible');
    });
  });

  describe('deferral lock', () => {
    it('is open for a regular pension', () => {
      expect(deferralLock(youWith({}))).toBeNull();
    });

    it('is locked for a special pension', () => {
      expect(deferralLock(youWith({ workAdded: true, hasSpecialPension: true }))).toBe(
        'specialPension',
      );
    });

    describe('with a special pension starting after the pension age', () => {
      const laterSpecialPension = {
        workAdded: true,
        hasSpecialPension: true,
        pensionAgeYears: '65',
        specialPensionStartAge: '68',
      };

      it('keeps the old-age pension in full until the special pension starts', () => {
        expect(deferralLock(youWith(laterSpecialPension))).toBe('specialPensionLater');
      });

      it('is open when the saver takes the flexible old-age pension instead', () => {
        expect(
          deferralLock(youWith({ ...laterSpecialPension, specialPensionPath: 'flexible' })),
        ).toBeNull();
      });
    });

    describe('for a rescuer waiting for the pension on the allowance', () => {
      const rescuer = { workAdded: true, hasRescue: true, rescueYears: '20' };

      it('is open, because the allowance is not a pension and ends at the pension age', () => {
        expect(deferralLock(youWith(rescuer))).toBeNull();
      });

      it('is open when only the allowance is chosen beside the children right', () => {
        expect(
          deferralLock(youWith({ ...rescuer, ...FIVE_CHILDREN, rescueBasis: 'toetus' })),
        ).toBeNull();
      });

      it('is locked when list 1 hazardous work gives an earlier pension than the allowance covers', () => {
        expect(
          deferralLock(
            youWith({
              ...rescuer,
              hazardList: 'list1',
              hazardYears: '10',
              earlyYearsPicked: '5',
            }),
          ),
        ).toBe('favourable');
      });

      it('is locked once the pension for children starts before the pension age', () => {
        expect(
          deferralLock(youWith({ ...rescuer, ...FIVE_CHILDREN, rescueBasis: 'pension' })),
        ).toBe('favourable');
      });
    });

    it('is locked for favourable terms and for a flexible pension', () => {
      expect(deferralLock(youWith(FIVE_CHILDREN))).toBe('favourable');
      expect(deferralLock(youWith({ earlyYearsPicked: '2' }))).toBe('flexible');
    });
  });

  describe('deferred pension', () => {
    it('raises the full pension by the deferral increase', () => {
      expect(deferredMonthly(1000, 'defer', 1)).toBeCloseTo(1079.3);
      expect(deferredMonthly(1000, 'defer', 5)).toBeCloseTo(1515.7);
    });

    it('raises half the increase when only half the pension is deferred', () => {
      expect(deferredMonthly(1000, 'half', 2)).toBeCloseTo(1084.4);
    });

    it('leaves the pension as it is when taken in full at once', () => {
      expect(deferredMonthly(1000, 'full', 3)).toBe(1000);
    });
  });

  describe('working during retirement', () => {
    it('offers every age from the year after retiring up to five years past the pension age', () => {
      const options = workUntilOptions(planOf());

      expect(options[0]).toBe(66);
      expect(options[options.length - 1]).toBe(75);
    });

    it('defaults to one more year, or to the pension age on favourable terms', () => {
      expect(workUntilOf({ ...initialAge65(), work: 'yes' }, planOf())).toBe(66);
      expect(workUntilOf({ ...initialAge65(), work: 'yes' }, planOf(FIVE_CHILDREN))).toBe(65);
    });

    it('uses the picked age when it is on offer, otherwise the default', () => {
      expect(workUntilOf({ ...initialAge65(), work: 'yes', workUntil: '68' }, planOf())).toBe(68);
      expect(workUntilOf({ ...initialAge65(), work: 'yes', workUntil: '40' }, planOf())).toBe(66);
    });

    it('has no age when not working', () => {
      expect(workUntilOf(initialAge65(), planOf())).toBeUndefined();
    });

    it('adds a little pension for each year worked on a salary, and nothing without one', () => {
      expect(
        workAccrualMonthly(youWith({ grossMonthly: '2000', secondPillarRate: '0.02' })),
      ).toBeGreaterThan(0);
      expect(workAccrualMonthly(youWith({ grossMonthly: '' }))).toBe(0);
    });
  });

  describe('deferral while working', () => {
    it('is the years worked past the pension age, at most five', () => {
      const working = { ...initialAge65(), work: 'yes' as const };

      expect(deferralYearsWhileWorking(working, planOf())).toBe(1);
      expect(deferralYearsWhileWorking({ ...working, workUntil: '68' }, planOf())).toBe(3);
      expect(deferralYearsWhileWorking({ ...working, workUntil: '75' }, planOf())).toBe(5);
    });

    it('is zero when not working or stopping at the pension age', () => {
      expect(deferralYearsWhileWorking(initialAge65(), planOf())).toBe(0);
      expect(
        deferralYearsWhileWorking({ ...initialAge65(), work: 'yes' }, planOf(FIVE_CHILDREN)),
      ).toBe(0);
    });
  });

  describe('payout choice made at another step', () => {
    it('is true when retiring five or more years before the pension age', () => {
      expect(isPayoutChoiceMadeAtAnotherStep(planOf())).toBe(false);
      expect(isPayoutChoiceMadeAtAnotherStep(planOf(FIVE_CHILDREN))).toBe(true);
    });
  });
});
