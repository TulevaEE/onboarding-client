import { fundPensionTerm, LifeTable, Sex, survival } from './pension';
import { lifeTable, within } from './testUtils';

describe('life table', () => {
  it('holds the remaining life expectancy at 65 for men and women that Statistics Estonia published for 2025', () => {
    expect(lifeTable.elada_jaanud.M[65]).toBe(16.33);
    expect(lifeTable.elada_jaanud.N[65]).toBe(21.43);
  });

  it('holds the remaining life expectancy at 65 for the whole population', () => {
    expect(lifeTable.elada_jaanud.K?.[65]).toBe(19.31);
  });

  it.each<[Sex, number]>([
    ['M', 65],
    ['N', 65],
    ['X', 66],
  ])('sets a 19 year fund pension term from the whole population for sex %s at %i', (sex, age) => {
    expect(fundPensionTerm(lifeTable, sex, age)).toBe(19);
  });

  it('lets about 51% of 65 year old men live to 81', () => {
    expect(survival(lifeTable, 'M', 65, 81)).toBeCloseTo(0.51, within(0.01));
  });

  it('gives no survival beyond the oldest age in the table', () => {
    expect(survival(lifeTable, 'M', 65, 101)).toBe(0);
  });

  it('averages men and women for another sex when a table has no whole-population column', () => {
    const { M, N } = lifeTable.ellujaajad;
    const withoutWholePopulation: LifeTable = { ...lifeTable, ellujaajad: { M, N } };
    const averageAt = (age: number) => (M[age] + N[age]) / 2;

    expect(survival(withoutWholePopulation, 'X', 65, 80)).toBeCloseTo(
      averageAt(80) / averageAt(65),
      within(1e-9),
    );
  });
});
