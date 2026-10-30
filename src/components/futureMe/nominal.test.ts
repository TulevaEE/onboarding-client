import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses } from './expensesAnswers';
import { CURRENT_YEAR } from './engine/pension';
import { nominalFactorAt, nominalResultOf } from './nominal';
import { ResultContext, resultOf } from './resultAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { initialAnswers, toStepPlanInput, YouAnswers } from './youAnswers';

const contextWith = (
  you: Partial<Pick<YouAnswers, 'secondPillarReturnPercent' | 'thirdPillarReturnPercent'>> = {},
  thirdPillarMonthly = '',
): ResultContext => {
  const answers = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    thirdPillarMonthly,
    ...you,
  };
  return {
    you: answers,
    plan: toStepPlanInput(answers),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
  };
};

describe('nominalFactorAt', () => {
  it('leaves this year as it is', () => {
    expect(nominalFactorAt(CURRENT_YEAR)).toBe(1);
  });

  it('grows prices two percent a year', () => {
    expect(nominalFactorAt(CURRENT_YEAR + 20)).toBeCloseTo(1.02 ** 20);
  });
});

describe('nominalResultOf', () => {
  const result = resultOf(contextWith());
  const nominal = nominalResultOf(result);
  const lateRow = result.rows[result.rows.length - 1];
  const lateNominal = nominal.rows[nominal.rows.length - 1];

  it('multiplies every amount of a year by that year’s price growth', () => {
    const factor = nominalFactorAt(lateRow.year);

    expect(lateNominal.i1).toBeCloseTo(lateRow.i1 * factor);
    expect(lateNominal.i2).toBeCloseTo(lateRow.i2 * factor);
    expect(lateNominal.spend).toBeCloseTo(lateRow.spend * factor);
    expect(lateNominal.i1g).toBeCloseTo(lateRow.i1g * factor);
    expect(lateNominal.tax1).toBeCloseTo(lateRow.tax1 * factor);
  });

  it('leaves ages, years, the share still alive and the cover ages as they are', () => {
    expect(lateNominal.age).toBe(lateRow.age);
    expect(lateNominal.year).toBe(lateRow.year);
    expect(lateNominal.alive).toBe(lateRow.alive);
    expect(nominal.coversNeedUntil).toBe(result.coversNeedUntil);
    expect(nominal.pensionStartAge).toBe(result.pensionStartAge);
  });

  it('does not change the result it was given', () => {
    const before = result.rows[0].i1;

    nominalResultOf(result);

    expect(result.rows[0].i1).toBe(before);
  });
});

describe('nominalResultOf, special pension against the old-age pension', () => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    workAdded: true,
    hasSpecialPension: true,
    specialPensionStartAge: '55',
  };
  const context: ResultContext = {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: { ...initialSpecialPension(), monthly: '900' },
    expenses: initialExpenses(),
  };
  const result = resultOf(context);
  const yearAt = (age: number) => result.rows.find((row) => row.age === age)?.year ?? 0;

  it('puts the amounts it compares into the prices of the year they are paid from', () => {
    const nominal = nominalResultOf(result);

    expect(nominal.firstPillar?.special).toBeCloseTo(
      (result.firstPillar?.special ?? 0) * nominalFactorAt(yearAt(result.pensionStartAge)),
    );
    expect(nominal.firstPillar?.oldAge).toBeCloseTo(
      (result.firstPillar?.oldAge ?? 0) * nominalFactorAt(yearAt(result.p1StartAge)),
    );
    expect(nominal.firstPillar?.paid).toBe(result.firstPillar?.paid);
  });

  it('is left alone for someone with no special pension', () => {
    expect(nominalResultOf(resultOf(contextWith())).firstPillar).toBeNull();
  });
});

describe('nominalResultOf, special pension against the old-age pension earned by the pension age', () => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '850',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    workAdded: true,
    hasSpecialPension: true,
    specialPensionStartAge: '55',
    hazardList: 'list1' as const,
    hazardYears: '10',
  };
  const context: ResultContext = {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), work: 'yes', workUntil: '65' },
    age66: initialAge66(),
    specialPension: { ...initialSpecialPension(), monthly: '1000' },
    expenses: initialExpenses(),
  };
  const result = resultOf(context);
  const atPa = result.firstPillar?.atPa;
  const factorAtPensionAge = nominalFactorAt(
    result.rows.find((row) => row.age === atPa?.age)?.year ?? 0,
  );

  it('compares the two in the prices of the pension age year, after retiring early', () => {
    const nominal = nominalResultOf(result);

    expect(result.pensionStartAge).toBeLessThan(atPa?.age ?? 0);
    expect(nominal.firstPillar?.special).toBeCloseTo(
      (result.firstPillar?.special ?? 0) * factorAtPensionAge,
    );
    expect(nominal.firstPillar?.atPa?.oldAge).toBeCloseTo((atPa?.oldAge ?? 0) * factorAtPensionAge);
    expect(nominal.firstPillar?.atPa?.paid).toBe(atPa?.paid);
  });
});
