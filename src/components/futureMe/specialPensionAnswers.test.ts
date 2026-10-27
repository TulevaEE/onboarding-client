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
    expect(secondPillarMonthly(youWith({ secondPillarRate: '0.02' }))).toBeCloseTo(120);
    expect(secondPillarMonthly(youWith({ secondPillarRate: '0' }))).toBe(0);
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
});
