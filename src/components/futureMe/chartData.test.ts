import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { chartRowsOf, chartSeriesOf, startSourcesOf, tableRowsOf } from './chartData';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';

const contextWith = (
  specialMonthly = '',
  age65: Partial<Age65Answers> = {},
  grossMonthly = '2000',
): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly,
    secondPillarAmount: '10000',
    ...(specialMonthly
      ? { hasSpecialPension: true, workAdded: true, specialPensionStartAge: '55' }
      : {}),
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), ...age65 },
    age66: initialAge66(),
    specialPension: { ...initialSpecialPension(), monthly: specialMonthly },
    expenses: initialExpenses(),
  };
};

describe('chartData', () => {
  it('starts at the pension age and ends at the last age the result covers', () => {
    const result = resultOf(contextWith());

    const rows = chartRowsOf(result, 791);

    expect(rows[0].age).toBe(result.pensionStartAge);
    expect(rows[rows.length - 1].age).toBe(result.rows[result.rows.length - 1].age);
  });

  it('rounds the amounts', () => {
    const result = resultOf(contextWith());
    const source = result.rows.filter((row) => row.age === result.pensionStartAge)[0];

    const [first] = chartRowsOf(result, 791);

    expect(first).toMatchObject({
      firstPillar: Math.round(source.i1),
      secondPillar: Math.round(source.i2),
      costs: Math.round(source.spend),
    });
  });

  it('leaves out the sources that pay nothing at any age', () => {
    const rows = chartRowsOf(resultOf(contextWith()), 791).map((row) => ({
      ...row,
      thirdPillar: 0,
      deposit: 0,
    }));

    expect(chartSeriesOf(rows).map(({ id }) => id)).toEqual(['firstPillar', 'secondPillar']);
  });

  it('shows the special pension, which is paid instead of the old-age pension when larger', () => {
    const ids = chartSeriesOf(chartRowsOf(resultOf(contextWith('1500')), 791)).map(({ id }) => id);

    expect(ids).toEqual(['specialPension']);
  });

  it('counts the salary as the income while still working, not the state pension', () => {
    const rows = chartRowsOf(resultOf(contextWith('', { work: 'yes', workUntil: '68' })), 791);
    const working = rows.filter((row) => row.age < 68);

    expect(working.length).toBeGreaterThan(0);
    working.forEach((row) => {
      expect(row.salary).toBe(row.costs);
      expect(row.firstPillar).toBe(0);
    });
    expect(rows.find((row) => row.age === 68)).toMatchObject({ salary: 0 });
  });

  it('puts the salary first among the layers', () => {
    const rows = chartRowsOf(resultOf(contextWith('', { work: 'yes', workUntil: '68' })), 791);

    expect(chartSeriesOf(rows)[0].id).toBe('salary');
  });

  it('shows the table every fifth age, at the pension age and when work ends', () => {
    const rows = chartRowsOf(resultOf(contextWith('', { work: 'yes', workUntil: '68' })), 791);

    expect(tableRowsOf(rows).map(({ age }) => age)).toEqual([65, 68, 70, 75, 80, 85, 90, 95, 100]);
  });

  it('sets the costs the saver chose against the income, also where the money falls short', () => {
    const rows = chartRowsOf(resultOf(contextWith()), 1261);

    expect(rows.every(({ costs }) => costs === 1261)).toBe(true);
  });

  it('leaves the special pension out of the income while working, as it is saved like the state pension', () => {
    const rows = chartRowsOf(resultOf(contextWith('1500', { work: 'yes', workUntil: '68' })), 791);

    const working = rows.filter(({ salary }) => salary > 0);
    expect(working.length).toBeGreaterThan(0);
    expect(working.map(({ specialPension }) => specialPension)).toEqual(working.map(() => 0));
  });

  it('starts the summary with the state pension, even before it is paid, when nothing else pays', () => {
    const [first] = chartRowsOf(resultOf(contextWith()), 791);
    const nothing = {
      ...first,
      salary: 0,
      firstPillar: 0,
      specialPension: 0,
      secondPillar: 0,
      thirdPillar: 0,
      deposit: 0,
    };

    expect(startSourcesOf(nothing)).toEqual(['firstPillar']);
  });

  it('shows how much is missing at the ages where the money does not cover the costs', () => {
    const rows = chartRowsOf(resultOf(contextWith('', {}, '600')), 791);

    const last = rows[rows.length - 1];
    expect(last.shortfall).toBeGreaterThan(0);
    expect(rows[0].shortfall).toBe(0);
  });

  it('shows how much is left over when the income is above the costs', () => {
    const [first] = chartRowsOf(resultOf(contextWith('1500')), 791);

    expect(first.surplus).toBe(first.specialPension + first.firstPillar - first.costs);
    expect(first.surplus).toBeGreaterThan(0);
  });

  it('leaves nothing over while the salary pays the costs', () => {
    const rows = chartRowsOf(resultOf(contextWith('', { work: 'yes', workUntil: '68' })), 791);

    expect(rows.filter(({ salary }) => salary > 0).map(({ surplus }) => surplus)).toEqual([
      0, 0, 0,
    ]);
  });
});
