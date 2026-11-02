import { pensionAge, pensionAgeMonthsIn, retirementYears } from './pension';

describe('pension age', () => {
  it('is 65 for people born in 1961, with no text of its own for the page to show', () => {
    expect(pensionAge(1961)).toEqual({ years: 65, months: 0, year: 2026, known: true });
  });

  it.each([
    [1962, 1],
    [1963, 3],
    [1964, 4],
  ])('follows the pension age the law sets for people born in %i', (birthYear, months) => {
    expect(pensionAge(birthYear)).toMatchObject({ years: 65, months, known: true });
  });

  it('is approximate for people born in 1970', () => {
    expect(pensionAge(1970).known).toBe(false);
  });

  it('keeps life expectancy at its last published level, so people born in 1990 retire at about 66 in 2056', () => {
    expect(pensionAge(1990)).toEqual({ years: 66, months: 0, year: 2056, known: false });
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
    [1962, 1, 65, 1, 2027],
    [1962, 11, 65, 1, 2027],
    [1962, 12, 65, 3, 2028],
    [1964, 8, 65, 4, 2029],
    [1964, 9, 65, 7, 2030],
  ])(
    'is the pension age of the year the saver born in %i, month %i, reaches it',
    (birthYear, birthMonth, years, months, year) => {
      expect(pensionAge(birthYear, birthMonth)).toMatchObject({ years, months, year });
    },
  );

  it('rounds the age down to whole years only after the saver reaches it', () => {
    expect(pensionAge(1966, 1)).toMatchObject({ years: 65, months: 10 });
    expect(pensionAge(1966, 6)).toMatchObject({ years: 66, months: 0 });
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
