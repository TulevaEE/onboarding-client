import { initialAge65 } from './age65Answers';
import { AVG_OLD_AGE_PENSION } from './engine/pension';
import { isRescueComparisonShown, rescueComparisonOf } from './kidsCompare';
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
      { basis: 'mix', toetus: 791, pension: 791, total: 47449, atPensionAge: 791 },
      { basis: 'pension', toetus: null, pension: 692, total: 8302, atPensionAge: 692 },
      { basis: 'toetus', toetus: 791, pension: null, total: 47449, atPensionAge: 791 },
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

  it('says who gets the child supplement and whether the forecast has it', () => {
    expect(rescueComparisonOf(withRescue()).supplement.state).toBe('unknown');
    expect(rescueComparisonOf(withRescue({ kidsInForecast: 'no' })).supplement.state).toBe('no');
    expect(rescueComparisonOf(withRescue({ kidsSupUser: 'other' })).supplement.state).toBe(
      'otherParent',
    );
  });
});
