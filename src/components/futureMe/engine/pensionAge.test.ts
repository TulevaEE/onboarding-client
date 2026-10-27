import { pensionAge, pensionAgeMonthsIn } from './pension';

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
