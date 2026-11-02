import { initialAge65 } from './age65Answers';
import { isRescueComparisonShown, isSpecialComparisonShown } from './kidsCompare';
import { contextWith } from './resultContextFixture';
import { initialSpecialPension } from './specialPensionAnswers';

const threeChildren = {
  kidsAdded: true,
  kidsCount: '3',
  kidsBirthYears: ['1990', '1992', '1994'],
};

const withRescue = (changes = {}, rest = {}) =>
  contextWith(
    {
      ...threeChildren,
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      ...changes,
    },
    rest,
  );

const withSpecialPension = (changes = {}, monthly = '900', age65 = {}) =>
  contextWith(
    {
      ...threeChildren,
      workAdded: true,
      hasSpecialPension: true,
      specialPensionStartAge: '55',
      ...changes,
    },
    {
      specialPension: { ...initialSpecialPension(), monthly },
      age65: { ...initialAge65(), ...age65 },
    },
  );

describe('rescue allowance or the pension for the children', () => {
  it('is compared only when both rights are the saver’s', () => {
    expect(isRescueComparisonShown(withRescue())).toBe(true);
    expect(isRescueComparisonShown(withRescue({ kidsEarlyUser: 'other' }))).toBe(false);
    expect(isRescueComparisonShown(contextWith(threeChildren))).toBe(false);
  });

  it('is compared while the earliest way starts this year or later, not once it has started', () => {
    expect(isRescueComparisonShown(withRescue({ birthYear: '1966' }))).toBe(true);
    expect(isRescueComparisonShown(withRescue({ birthYear: '1965' }))).toBe(false);
  });

  it('is not compared while a special pension is counted, as only one state pension is paid', () => {
    const specialPensionFrom55 = withRescue(
      { hasSpecialPension: true, specialPensionStartAge: '55' },
      { specialPension: { ...initialSpecialPension(), monthly: '1200' } },
    );

    expect(isRescueComparisonShown(specialPensionFrom55)).toBe(false);
  });
});

describe('special pension or the pension for the children', () => {
  it('is compared only with a special pension, an early right from the children and no flexible pension', () => {
    expect(isSpecialComparisonShown(withSpecialPension())).toBe(true);
    expect(isSpecialComparisonShown(withSpecialPension({ kidsAdded: false }))).toBe(false);
    expect(isSpecialComparisonShown(withSpecialPension({ kidsEarlyUser: 'other' }))).toBe(false);
    expect(isSpecialComparisonShown(withSpecialPension({ hasSpecialPension: false }))).toBe(false);
    expect(isSpecialComparisonShown(withSpecialPension({}, ''))).toBe(false);
    expect(
      isSpecialComparisonShown(
        withSpecialPension({ earlyYearsPicked: '3', specialPensionStartAge: '64' }),
      ),
    ).toBe(false);
  });

  it('is compared while the early retirement for the children starts this year or later, not once it has started', () => {
    expect(isSpecialComparisonShown(withSpecialPension({ birthYear: '1962' }))).toBe(true);
    expect(isSpecialComparisonShown(withSpecialPension({ birthYear: '1961' }))).toBe(false);
  });

  it('is compared only once the special pension has started by the early retirement for the children', () => {
    const fourChildren = {
      kidsCount: '4',
      kidsBirthYears: ['1990', '1992', '1994', '1996'],
    };

    expect(
      isSpecialComparisonShown(
        withSpecialPension({ ...fourChildren, specialPensionStartAge: '62' }),
      ),
    ).toBe(true);
    expect(
      isSpecialComparisonShown(
        withSpecialPension({ ...fourChildren, specialPensionStartAge: '63' }),
      ),
    ).toBe(false);
    expect(isSpecialComparisonShown(withSpecialPension({ specialPensionStartAge: '65' }))).toBe(
      false,
    );
  });
});
