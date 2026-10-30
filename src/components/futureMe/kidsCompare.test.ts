import { initialAge65 } from './age65Answers';
import { AVG_OLD_AGE_PENSION } from './engine/pension';
import {
  isRescueComparisonShown,
  isSpecialComparisonShown,
  rescueComparisonOf,
  specialComparisonOf,
} from './kidsCompare';
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

const amountsOf = (rows: ReturnType<typeof rescueComparisonOf>['rows']) =>
  rows.map(({ basis, toetus, pension, total, atPensionAge }) => ({
    basis,
    toetus: toetus && Math.round(toetus.monthly),
    pension: pension && Math.round(pension.monthly),
    total: Math.round(total),
    atPensionAge: Math.round(atPensionAge),
  }));

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

const optionsOf = (context: ReturnType<typeof withSpecialPension>) => {
  const { special, oldAge } = specialComparisonOf(context);
  return [special, oldAge].map(({ from, monthly, total, atPensionAge }) => ({
    from,
    monthly: Math.round(monthly),
    total: Math.round(total),
    atPensionAge: Math.round(atPensionAge),
  }));
};

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

  it('lays out when each way leaves work, pays the allowance and then the pension', () => {
    const { pensionAge, rows } = rescueComparisonOf(withRescue());

    expect(pensionAge).toBe(65);
    expect(
      rows.map(({ basis, workUntil, toetus, pension }) => ({
        basis,
        workUntil,
        toetus: toetus && [toetus.from, toetus.to],
        pension: pension && [pension.from, pension.to],
      })),
    ).toEqual([
      { basis: 'mix', workUntil: 60, toetus: [60, 63], pension: [64, 64] },
      { basis: 'pension', workUntil: 64, toetus: null, pension: [64, 64] },
      { basis: 'toetus', workUntil: 60, toetus: [60, 64], pension: null },
    ]);
  });

  it('starts the pension for a disabled child only once the child has been raised for eight years', () => {
    const { kidsYears, rows, family } = rescueComparisonOf(
      withRescue({
        birthYear: '1970',
        kidsCount: '1',
        kidsBirthYears: ['2025'],
        kidsDisabled: [true],
      }),
    );

    expect(
      rows.map(({ basis, workUntil, toetus, pension }) => ({
        basis,
        workUntil,
        toetus: toetus && [toetus.from, toetus.to],
        pension: pension && [pension.from, pension.to],
      })),
    ).toEqual([
      { basis: 'mix', workUntil: 60, toetus: [60, 62], pension: [63, 64] },
      { basis: 'pension', workUntil: 63, toetus: null, pension: [63, 64] },
      { basis: 'toetus', workUntil: 60, toetus: [60, 64], pension: null },
    ]);
    expect([kidsYears, family?.kidsYears]).toEqual([2, 2]);
  });

  it('pays each way a month and in total before the pension age, and the pension at it', () => {
    expect(amountsOf(rescueComparisonOf(withRescue()).rows)).toEqual([
      { basis: 'mix', toetus: 791, pension: 923, total: 49033, atPensionAge: 923 },
      { basis: 'pension', toetus: null, pension: 802, total: 9622, atPensionAge: 802 },
      { basis: 'toetus', toetus: 791, pension: null, total: 47449, atPensionAge: 923 },
    ]);
  });

  it('leaves every way at its earliest, without the work the saver continues at the pension age', () => {
    const workingUntil65 = { age65: { ...initialAge65(), work: 'yes' as const, workUntil: '65' } };

    expect(amountsOf(rescueComparisonOf(withRescue({}, workingUntil65)).rows)).toEqual(
      amountsOf(rescueComparisonOf(withRescue()).rows),
    );
  });

  it('adds the family with the other parent retiring early for the children on the average pension', () => {
    const { family, rows } = rescueComparisonOf(withRescue());
    const toetus = rows.find(({ basis }) => basis === 'toetus');

    expect(family).toEqual({
      kidsYears: 1,
      partnerMonthly: AVG_OLD_AGE_PENSION,
      partnerTotal: AVG_OLD_AGE_PENSION * 12,
      total: (toetus?.total ?? 0) + AVG_OLD_AGE_PENSION * 12,
    });
  });

  it('says who gets the child supplement', () => {
    expect(rescueComparisonOf(withRescue()).supplement).toBe('self');
    expect(rescueComparisonOf(withRescue({ kidsSupUser: 'other' })).supplement).toBe('otherParent');
    expect(rescueComparisonOf(withRescue({ kidsSupUser: 'split' })).supplement).toBe('split');
  });

  it('says the saver gets a supplement when the other parent gets it but the saver got the II pillar payment for the unpaid months', () => {
    const youngestUnpaidFor12Months = withRescue({
      kidsBirthYears: ['1990', '1992', '2022'],
      kidsBirthMonths: ['', '', '3'],
      kidsIIMonths: ['', '', '24'],
      kidsSupUser: 'other',
      kidsIIUser: 'me',
    });

    expect(rescueComparisonOf(youngestUnpaidFor12Months).supplement).toBe('self');
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

  it('pays each a month and in total from the early retirement for the children, and the pension at the pension age', () => {
    const { pensionAge, kidsYears } = specialComparisonOf(withSpecialPension());

    expect({ pensionAge, kidsYears }).toEqual({ pensionAge: 65, kidsYears: 1 });
    expect(optionsOf(withSpecialPension())).toEqual([
      { from: 64, monthly: 900, total: 10800, atPensionAge: 900 },
      { from: 64, monthly: 802, total: 9622, atPensionAge: 802 },
    ]);
  });

  it('adds the family with the saver on the special pension and the other parent retiring early for the children', () => {
    const { family } = specialComparisonOf(withSpecialPension());

    expect(family).toEqual({
      kidsYears: 1,
      partnerMonthly: AVG_OLD_AGE_PENSION,
      partnerTotal: AVG_OLD_AGE_PENSION * 12,
      total: 900 * 12 + AVG_OLD_AGE_PENSION * 12,
    });
  });

  it('starts both at the early retirement for the children, not at an earlier one from the rescue service or hazardous work', () => {
    expect(optionsOf(withSpecialPension({ hasRescue: true, rescueYears: '20' }))).toEqual([
      { from: 64, monthly: 900, total: 10800, atPensionAge: 900 },
      { from: 64, monthly: 802, total: 9622, atPensionAge: 802 },
    ]);
    expect(optionsOf(withSpecialPension({ hazardList: 'list1', hazardYears: '10' }))).toEqual([
      { from: 64, monthly: 900, total: 10800, atPensionAge: 900 },
      { from: 64, monthly: 805, total: 9661, atPensionAge: 805 },
    ]);
  });

  it('marks the larger one as the choice until the saver picks, and the saver’s pick once made', () => {
    const choiceOf = (context: ReturnType<typeof withSpecialPension>) => {
      const { current, isSpecialHigher } = specialComparisonOf(context);
      return { current, isSpecialHigher };
    };

    expect(choiceOf(withSpecialPension())).toEqual({ current: 'special', isSpecialHigher: true });
    expect(choiceOf(withSpecialPension({}, '500'))).toEqual({
      current: 'oldAge',
      isSpecialHigher: false,
    });
    expect(
      choiceOf(withSpecialPension({}, '900', { firstPillarChoice: 'oldAge' as const })),
    ).toEqual({ current: 'oldAge', isSpecialHigher: true });
  });
});
