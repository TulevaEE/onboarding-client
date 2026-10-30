import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { chartRowsOf, chartSeriesOf, startSourcesOf, tableRowsOf } from './chartData';
import { CURRENT_YEAR } from './engine/pension';
import { nominalFactorAt, nominalResultOf } from './nominal';
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

const withFundPensionFrom55 = (
  age65: Partial<Age65Answers> = {},
  pensionAgeYears = '65',
): ResultContext => {
  const context = contextWith('', age65);
  const you = {
    ...context.you,
    pensionAgeYears,
    thirdPillarJoined: 'before' as const,
    thirdPillarAmount: '8000',
    thirdPillarPlan: 'fund' as const,
  };
  return { ...context, you, plan: toStepPlanInput(you) };
};

describe('chartData', () => {
  describe('with the III pillar fund pension from 55', () => {
    const result = resultOf(withFundPensionFrom55());
    const rows = chartRowsOf(result, 791);
    const beforePension = rows.filter(({ isBeforePension }) => isBeforePension);

    it('starts at the first fund pension payment, before the pension age', () => {
      expect(rows[0].age).toBe(55);
      expect(beforePension.map(({ age }) => age)).toEqual(
        result.earlyThirdPillar.map(({ age }) => age),
      );
      expect(rows[beforePension.length].age).toBe(result.pensionStartAge);
    });

    it('shows only the III pillar fund pension before the pension age, without costs to cover', () => {
      expect(beforePension[0]).toMatchObject({
        thirdPillar: Math.round(result.earlyThirdPillar[0].amount),
        salary: 0,
        firstPillar: 0,
        secondPillar: 0,
        costs: 0,
        shortfall: 0,
        surplus: 0,
      });
    });

    it('turns the early payments into future euros too', () => {
      const [first] = chartRowsOf(nominalResultOf(result), 791, true);

      expect(first.thirdPillar).toBe(
        Math.round(result.earlyThirdPillar[0].amount * nominalFactorAt(first.year)),
      );
    });

    it('shows the first fund pension year and the pension age in the table', () => {
      const ages = tableRowsOf(rows).map(({ age }) => age);

      expect(ages.slice(0, 3)).toEqual([55, 60, result.pensionStartAge]);
    });

    it('shows the pension age in the table when it falls between the five-year steps', () => {
      const laterResult = resultOf(withFundPensionFrom55({}, '66'));
      const ages = tableRowsOf(chartRowsOf(laterResult, 791)).map(({ age }) => age);

      expect(laterResult.pensionStartAge).toBe(66);
      expect(ages.slice(0, 5)).toEqual([55, 60, 65, 66, 70]);
    });
  });

  describe('with the III pillar fund pension from 55 while working past the pension age', () => {
    const result = resultOf(withFundPensionFrom55({ work: 'yes', workUntil: '70' }));
    const untilWorkEnd = chartRowsOf(result, 791).filter(({ age }) => age < 70);

    it('keeps showing the fund pension in the years worked past the pension age', () => {
      expect(untilWorkEnd.map(({ age }) => age)).toEqual(
        Array.from({ length: 70 - 55 }, (_, offset) => 55 + offset),
      );
      expect(untilWorkEnd.every(({ thirdPillar }) => thirdPillar > 0)).toBe(true);
    });
  });

  describe('in future prices', () => {
    const result = resultOf(contextWith());
    const rows = chartRowsOf(nominalResultOf(result), 791, true);
    const last = rows[rows.length - 1];

    it('lets the costs grow with prices year by year', () => {
      expect(rows[0].costs).toBe(Math.round(791 * nominalFactorAt(rows[0].year)));
      expect(last.costs).toBe(Math.round(791 * nominalFactorAt(last.year)));
      expect(last.year).toBeGreaterThan(CURRENT_YEAR);
    });

    it('measures a shortfall against that year’s costs', () => {
      const shortfallRows = chartRowsOf(
        nominalResultOf(resultOf(contextWith('', {}, '500'))),
        3000,
        true,
      );

      shortfallRows.forEach((row) => {
        expect(row.shortfall > 0 && row.surplus > 0).toBe(false);
      });
    });
  });

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
      secondPillar: Math.round(source.i2 - source.extra2),
      secondPillarTaxed: Math.round(source.extra2),
      costs: Math.round(source.spend),
    });
  });

  it('leaves out the sources that pay nothing at any age', () => {
    const rows = chartRowsOf(resultOf(contextWith()), 791).map((row) => ({
      ...row,
      thirdPillar: 0,
      deposit: 0,
    }));

    expect(chartSeriesOf(rows).map(({ id }) => id)).toEqual(['firstPillar', 'secondPillarTaxed']);
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
      secondPillarTaxed: 0,
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

describe('chartData with the II pillar taken when needed', () => {
  const result = resultOf(contextWith('', { secondPillar: 'grow' }));
  const rows = chartRowsOf(result, 1500);

  it('keeps what is taken when needed apart from the tax-free fund pension', () => {
    const taxedFrom = rows.find(({ secondPillarTaxed }) => secondPillarTaxed > 0);

    expect(taxedFrom).toMatchObject({ secondPillar: 0 });
  });

  it('adds up to what the engine pays from the II pillar', () => {
    rows.forEach((row) => {
      const paid = result.rows.find(({ age }) => age === row.age)?.i2 ?? 0;
      expect(Math.abs(row.secondPillar + row.secondPillarTaxed - paid)).toBeLessThanOrEqual(1);
    });
  });

  it('lists the taxed layer as its own series', () => {
    expect(chartSeriesOf(rows).map(({ id }) => id)).toContain('secondPillarTaxed');
  });
});
