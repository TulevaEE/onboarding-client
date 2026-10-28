import { AVG_OLD_AGE_PENSION } from './engine/pension';
import { isRescueComparisonShown, rescueComparisonOf } from './kidsCompare';
import { contextWith } from './resultContextFixture';

const threeChildren = {
  kidsAdded: true,
  kidsCount: '3',
  kidsBirthYears: ['1990', '1992', '1994'],
};

const withRescue = (changes = {}) =>
  contextWith({
    ...threeChildren,
    workAdded: true,
    hasRescue: true,
    rescueYears: '20',
    ...changes,
  });

describe('rescue allowance or the pension for the children', () => {
  it('is compared only when both rights are the saver’s', () => {
    expect(isRescueComparisonShown(withRescue())).toBe(true);
    expect(isRescueComparisonShown(withRescue({ kidsEarlyUser: 'other' }))).toBe(false);
    expect(isRescueComparisonShown(contextWith(threeChildren))).toBe(false);
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
