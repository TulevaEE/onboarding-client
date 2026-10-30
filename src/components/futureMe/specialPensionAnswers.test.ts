import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import {
  firstPillarComparison,
  initialSpecialPension,
  isPayAsked,
  isSpecialPensionStarted,
  isWorkAsked,
  secondPillarMonthly,
  specialPensionStartAge,
} from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const noPrefill = { birthYear: 1980, sex: null, secondPillarRate: null };
const youWith = (changes: Partial<ReturnType<typeof initialAnswers>> = {}) => ({
  ...initialAnswers(noPrefill),
  pensionAgeYears: '65',
  firstPillarMonthly: '700',
  grossMonthly: '2000',
  workAdded: true,
  hasSpecialPension: true,
  specialPensionStartAge: '50',
  ...changes,
});
const planOf = (changes: Partial<ReturnType<typeof initialAnswers>> = {}) =>
  toStepPlanInput(youWith(changes));

describe('specialPensionAnswers', () => {
  it('starts with no amount, working on and the same salary', () => {
    expect(initialSpecialPension()).toEqual({ monthly: '', work: 'yes', pay: 'same', gross: '' });
  });

  it('starts the special pension at the typed age, or at the pension age when none is typed', () => {
    expect(specialPensionStartAge(planOf())).toBe(50);
    expect(specialPensionStartAge(planOf({ specialPensionStartAge: '' }))).toBe(65);
  });

  it('knows a special pension started once the saver reached its start age, counting the birth month', () => {
    const midOctober2026 = new Date(2026, 9, 15);
    const startingAt55 = (birthMonth: number) =>
      planOf({ birthYear: '1971', birthMonth, specialPensionStartAge: '55' });

    expect(isSpecialPensionStarted(startingAt55(3), midOctober2026)).toBe(true);
    expect(isSpecialPensionStarted(startingAt55(12), midOctober2026)).toBe(false);
  });

  it('knows a special pension that started before the current age', () => {
    expect(isSpecialPensionStarted(planOf({ specialPensionStartAge: '40' }))).toBe(true);
    expect(isSpecialPensionStarted(planOf())).toBe(false);
  });

  it('asks about working only when the special pension starts before the pension age and later than now', () => {
    expect(isWorkAsked(planOf())).toBe(true);
    expect(isWorkAsked(planOf({ specialPensionStartAge: '65' }))).toBe(false);
    expect(isWorkAsked(planOf({ specialPensionStartAge: '40' }))).toBe(false);
  });

  it('asks about the salary only while working on', () => {
    const plan = planOf();

    expect(isPayAsked({ ...initialSpecialPension(), work: 'yes' }, plan)).toBe(true);
    expect(isPayAsked({ ...initialSpecialPension(), work: 'no' }, plan)).toBe(false);
  });

  it('counts the second pillar payment from the salary with the state 4%', () => {
    const plan = planOf();

    expect(
      secondPillarMonthly(youWith({ secondPillarRate: '0.02' }), initialSpecialPension(), plan),
    ).toBeCloseTo(120);
    expect(
      secondPillarMonthly(youWith({ secondPillarRate: '0' }), initialSpecialPension(), plan),
    ).toBe(0);
  });

  it('counts the second pillar payment from the new salary when the salary changes', () => {
    const changed = { ...initialSpecialPension(), pay: 'change' as const, gross: '1000' };

    expect(
      secondPillarMonthly(youWith({ secondPillarRate: '0.02' }), changed, planOf()),
    ).toBeCloseTo(60);
  });

  it('compares the special pension with the old-age pension once the amount is known', () => {
    const you = youWith();
    const plan = planOf();

    expect(firstPillarComparison(initialSpecialPension(), you, plan)).toBeNull();
    expect(
      firstPillarComparison({ ...initialSpecialPension(), monthly: '900' }, you, plan),
    ).toMatchObject({ special: 900, oldAge: 700, larger: 'special' });
    expect(
      firstPillarComparison({ ...initialSpecialPension(), monthly: '500' }, you, plan),
    ).toMatchObject({ special: 500, oldAge: 700, larger: 'oldAge' });
  });

  it('compares with the old-age pension the result pays, its child supplement counting the II pillar money saved', () => {
    const changes = {
      secondPillarRate: '0',
      secondPillarAmount: '20000',
      kidsAdded: true,
      kidsCount: '1',
      kidsBirthYears: ['2022'],
    };

    expect(
      firstPillarComparison(
        { ...initialSpecialPension(), monthly: '720' },
        youWith(changes),
        planOf(changes),
      ),
    ).toMatchObject({ special: 720, oldAge: 700, larger: 'special' });
  });

  describe('compares with the old-age pension as the saver retires', () => {
    const withAmount = { ...initialSpecialPension(), monthly: '900' };
    const oldAgeFor = (changes: Partial<ReturnType<typeof initialAnswers>>) =>
      firstPillarComparison(withAmount, youWith(changes), planOf(changes))?.oldAge;

    it('lowers the old-age pension for the years taken early on hazardous work', () => {
      expect(oldAgeFor({ hazardList: 'list1', hazardYears: '10' })).toBeLessThan(700);
    });

    it('lowers the old-age pension further with a flexible pension that starts before the special pension', () => {
      const threeChildren = {
        kidsAdded: true,
        kidsCount: '3',
        kidsBirthYears: ['2000', '2002', '2004'],
        specialPensionStartAge: '62',
      };

      expect(oldAgeFor({ ...threeChildren, earlyYearsPicked: '5' })).toBeLessThan(
        oldAgeFor(threeChildren) as number,
      );
    });

    it('counts the rescue service years', () => {
      expect(oldAgeFor({ hasRescue: true, rescueYears: '20' })).not.toBe(700);
    });

    it('compares a special pension that already started', () => {
      expect(
        firstPillarComparison(
          withAmount,
          youWith({ specialPensionStartAge: '40' }),
          planOf({ specialPensionStartAge: '40' }),
        ),
      ).toMatchObject({ special: 900, larger: 'special' });
    });
  });

  describe('after working on past the retirement age', () => {
    const early = { hazardList: 'list1' as const, hazardYears: '10' };
    const you = youWith(early);
    const plan = planOf(early);
    const special = { ...initialSpecialPension(), monthly: '900' };
    const workingOn = { ...initialAge65(), work: 'yes' as const, workUntil: '65' };

    it('offers the comparison again at the ordinary pension age when the special pension was kept', () => {
      expect(firstPillarComparison(special, you, plan)?.atPa).toBeNull();
      expect(firstPillarComparison(special, you, plan, workingOn)?.atPa).toMatchObject({
        age: 65,
        paid: 'special',
      });
    });

    it('pays the old-age pension from the retirement age once it is chosen', () => {
      const chosen = { ...workingOn, firstPillarChoice: 'oldAge' as const };

      expect(firstPillarComparison(special, you, plan, chosen)).toMatchObject({
        paid: 'oldAge',
        atPa: null,
      });
    });

    it('pays the old-age pension from the ordinary pension age once it is chosen there', () => {
      const chosenAtPensionAge = { ...initialAge66(), firstPillarChoicePa: 'oldAge' as const };

      expect(
        firstPillarComparison(special, you, plan, workingOn, chosenAtPensionAge)?.atPa,
      ).toMatchObject({ paid: 'oldAge' });
    });
  });
});
