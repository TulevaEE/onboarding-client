import { pensionAge, pensionAgeMonthsIn, retirementYears } from './pension';

describe('pension age', () => {
  it('is 65 for people born in 1961', () => {
    expect(pensionAge(1961).label).toBe('65 a');
  });

  it.each([
    [1962, '65 a 1 k'],
    [1963, '65 a 3 k'],
    [1964, '65 a 4 k'],
  ])('follows the pension age the law sets for people born in %i', (birthYear, label) => {
    expect(pensionAge(birthYear).label).toBe(label);
  });

  it('is approximate for people born in 1970', () => {
    expect(pensionAge(1970).label).toMatch(/^u /);
  });

  it('keeps life expectancy at its last published level, so people born in 1990 retire at about 66 in 2056', () => {
    const { label, year } = pensionAge(1990);

    expect({ label, year }).toEqual({ label: 'u 66 a', year: 2056 });
  });

  it('rises by at most 3 months a year from 2027 to 2059', () => {
    const years = Array.from({ length: 2060 - 2027 }, (_, index) => 2027 + index);
    const yearlyRises = years.map((year) => ({
      year,
      rise: pensionAgeMonthsIn(year) - pensionAgeMonthsIn(year - 1),
    }));

    expect(yearlyRises.filter(({ rise }) => rise > 3)).toEqual([]);
  });
});

describe('pension age for the month of birth', () => {
  it.each([
    [1962, 1, '65 a 1 k', 2027],
    [1962, 11, '65 a 1 k', 2027],
    [1962, 12, '65 a 3 k', 2028],
    [1964, 8, '65 a 4 k', 2029],
    [1964, 9, 'u 65 a 7 k', 2030],
  ])(
    'is the pension age of the year the saver born in %i, month %i, reaches it',
    (birthYear, birthMonth, label, year) => {
      const age = pensionAge(birthYear, birthMonth);

      expect({ label: age.label, year: age.year }).toEqual({ label, year });
    },
  );

  it('rounds the age down to whole years only after the saver reaches it', () => {
    expect(pensionAge(1966, 1).label).toBe('u 65 a 10 k');
    expect(pensionAge(1966, 6).label).toBe('u 66 a');
  });

  it('is the age of someone born in January when the month is not known', () => {
    expect(pensionAge(1962)).toEqual(pensionAge(1962, 1));
    expect(pensionAge(1966)).toEqual(pensionAge(1966, 1));
  });

  it('gives the pension age in whole years of an input with a birth month', () => {
    expect(retirementYears({ birthYear: 1966 })).toBe(65);
    expect(retirementYears({ birthYear: 1966, birthMonth: 6 })).toBe(66);
    expect(retirementYears({ birthYear: 1966, birthMonth: 6, pensionAgeYears: 67 })).toBe(67);
  });
});
