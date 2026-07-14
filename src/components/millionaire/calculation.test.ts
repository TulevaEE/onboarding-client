import {
  buildComparison,
  HIGH_FEE,
  LAURA_SECOND_PILLAR_RATE,
  project,
  THIRD_PILLAR_ANNUAL_TAX_CAP,
  thirdPillarTaxCapMonthly,
  trajectory,
  TULEVA_FEE,
} from './calculation';

// ---------------------------------------------------------------------------
// Parity oracle — copied VERBATIM from the campaign prototype
// (tuleva/work/karoliina/Juuli kampaania 2026/miljonariks-landing.html), the
// agreed source of truth for the numbers. The only change is that the hardcoded
// `PENSION = 67` is threaded in as a `pension` parameter so we can exercise the
// per-user retirement age. Our clean TypeScript port must reproduce these
// figures exactly, so any accidental divergence in the arithmetic fails a test.
// ---------------------------------------------------------------------------

interface OracleInput {
  vanus: number; // current age
  palk: number; // gross monthly salary
  saldo: number; // combined II + III balance today
  rate: number; // II pillar employee rate (2 | 4 | 6)
  iiiPct: number; // III pillar, percent of gross
  toot: number; // expected annual return, percent
}

function referenceProject(o: OracleInput, fee: number, pension: number) {
  const netA = o.toot / 100 - fee;
  const rm = (1 + Math.max(netA, -0.99)) ** (1 / 12) - 1;
  const g = 0.03;
  const iiR = (o.rate + 4) / 100;
  const start = o.vanus;
  let salary = o.palk;
  let ii = o.saldo;
  let iii = 0;
  let millAge: number | null = ii >= 1e6 ? start : null;
  for (let age = start; age < pension; age += 1) {
    const iiiAnnual = Math.min((o.iiiPct / 100) * salary * 12, 6000);
    const iiiM = iiiAnnual / 12;
    for (let m = 0; m < 12; m += 1) {
      ii = ii * (1 + rm) + salary * iiR;
      iii = iii * (1 + rm) + iiiM;
    }
    salary *= 1 + g;
    if (millAge === null && ii + iii >= 1e6) {
      millAge = age + 1;
    }
  }
  const total = ii + iii;
  if (millAge === null && netA > 0) {
    let t = total;
    let a = pension;
    while (t < 1e6 && a < 101) {
      t *= 1 + netA;
      a += 1;
    }
    if (t >= 1e6) {
      millAge = a;
    }
  }
  return { total, ii, iii, millAge };
}

function referenceTrajectory(o: OracleInput, fee: number, pension: number) {
  const netA = o.toot / 100 - fee;
  const rm = (1 + Math.max(netA, -0.99)) ** (1 / 12) - 1;
  const g = 0.03;
  const iiR = (o.rate + 4) / 100;
  let salary = o.palk;
  let ii = o.saldo;
  let iii = 0;
  const pts = [{ age: o.vanus, val: o.saldo }];
  for (let age = o.vanus; age < pension; age += 1) {
    const iiiAnnual = Math.min((o.iiiPct / 100) * salary * 12, 6000);
    const iiiM = iiiAnnual / 12;
    for (let m = 0; m < 12; m += 1) {
      ii = ii * (1 + rm) + salary * iiR;
      iii = iii * (1 + rm) + iiiM;
    }
    salary *= 1 + g;
    pts.push({ age: age + 1, val: ii + iii });
  }
  return pts;
}

describe('project — parity with the prototype (percent-of-salary III pillar)', () => {
  const ages = [25, 35, 45, 60, 66];
  const salaries = [0, 1000, 2400, 5000];
  const balances = [0, 15000, 250000];
  const rates = [2, 4, 6];
  const thirdPillarPercents = [0, 15];
  const returns = [-10, -3, 0, 3, 7, 10];
  const retirementAges = [65, 67, 68];

  it('reproduces total, per-pillar split and millionaire age for the whole input matrix', () => {
    let cases = 0;
    ages.forEach((vanus) =>
      salaries.forEach((palk) =>
        balances.forEach((saldo) =>
          rates.forEach((rate) =>
            thirdPillarPercents.forEach((iiiPct) =>
              returns.forEach((toot) =>
                retirementAges.forEach((pension) => {
                  const oracle: OracleInput = { vanus, palk, saldo, rate, iiiPct, toot };
                  const expected = referenceProject(oracle, TULEVA_FEE, pension);
                  const actual = project({
                    currentAge: vanus,
                    retirementAge: pension,
                    grossSalaryMonthly: palk,
                    initialBalance: saldo,
                    secondPillarRate: rate,
                    thirdPillar: { mode: 'percentOfSalary', percent: iiiPct },
                    annualReturnPercent: toot,
                  });
                  expect(actual.total).toBeCloseTo(expected.total, 6);
                  expect(actual.secondPillar).toBeCloseTo(expected.ii, 6);
                  expect(actual.thirdPillar).toBeCloseTo(expected.iii, 6);
                  expect(actual.millionaireAge).toBe(expected.millAge);
                  cases += 1;
                }),
              ),
            ),
          ),
        ),
      ),
    );
    // Guard against the matrix silently collapsing to nothing.
    expect(cases).toBe(
      ages.length *
        salaries.length *
        balances.length *
        rates.length *
        thirdPillarPercents.length *
        returns.length *
        retirementAges.length,
    );
  });

  it('reproduces the high-fee trajectory used for the fee-drag comparison', () => {
    const oracle: OracleInput = {
      vanus: 35,
      palk: 2400,
      saldo: 15000,
      rate: 6,
      iiiPct: 15,
      toot: 7,
    };
    const expected = referenceProject(oracle, HIGH_FEE, 67);
    const actual = project({
      currentAge: 35,
      retirementAge: 67,
      grossSalaryMonthly: 2400,
      initialBalance: 15000,
      secondPillarRate: 6,
      thirdPillar: { mode: 'percentOfSalary', percent: 15 },
      annualReturnPercent: 7,
      fee: HIGH_FEE,
    });
    expect(actual.total).toBeCloseTo(expected.total, 6);
  });
});

describe('trajectory — parity with the prototype', () => {
  it('reproduces every yearly point for a representative saver', () => {
    const oracle: OracleInput = {
      vanus: 30,
      palk: 2000,
      saldo: 15000,
      rate: 2,
      iiiPct: 0,
      toot: 7,
    };
    const expected = referenceTrajectory(oracle, TULEVA_FEE, 67);
    const actual = trajectory({
      currentAge: 30,
      retirementAge: 67,
      grossSalaryMonthly: 2000,
      initialBalance: 15000,
      secondPillarRate: 2,
      thirdPillar: { mode: 'percentOfSalary', percent: 0 },
      annualReturnPercent: 7,
    });
    expect(actual).toHaveLength(expected.length);
    actual.forEach((point, i) => {
      expect(point.age).toBe(expected[i].age);
      expect(point.value).toBeCloseTo(expected[i].val, 6);
    });
  });

  it('starts at the current age with the seed balance and ends at the retirement age', () => {
    const actual = trajectory({
      currentAge: 40,
      retirementAge: 65,
      grossSalaryMonthly: 2000,
      initialBalance: 33000,
      secondPillarRate: 4,
      thirdPillar: { mode: 'percentOfSalary', percent: 15 },
      annualReturnPercent: 5,
    });
    expect(actual[0]).toEqual({ age: 40, value: 33000 });
    expect(actual[actual.length - 1].age).toBe(65);
    expect(actual).toHaveLength(65 - 40 + 1);
  });
});

describe('project — fixed monthly III pillar (the real "today" contribution)', () => {
  it('accumulates a flat contribution linearly when return and fee are zero', () => {
    const result = project({
      currentAge: 30,
      retirementAge: 40,
      grossSalaryMonthly: 0, // isolate the III pillar: no II contribution
      initialBalance: 0,
      secondPillarRate: 2,
      thirdPillar: { mode: 'fixedAnnual', annual: 1200 },
      annualReturnPercent: 0,
      fee: 0,
    });
    expect(result.secondPillar).toBe(0);
    expect(result.thirdPillar).toBeCloseTo(1200 * 10, 6); // 10 years x 1200
    expect(result.total).toBeCloseTo(12000, 6);
  });

  it('seeds an existing III balance into the III bucket, not II', () => {
    const result = project({
      currentAge: 60,
      retirementAge: 61,
      grossSalaryMonthly: 2000,
      initialBalance: 10000,
      initialThirdPillarBalance: 3000,
      secondPillarRate: 0, // no II contribution
      thirdPillar: { mode: 'fixedAnnual', annual: 0 }, // no III contribution
      annualReturnPercent: 0,
      fee: 0,
    });
    expect(result.secondPillar).toBeCloseTo(7000, 6);
    expect(result.thirdPillar).toBeCloseTo(3000, 6);
    expect(result.total).toBeCloseTo(10000, 6);
  });

  it('caps the annual fixed contribution at the tax-deductible ceiling', () => {
    const result = project({
      currentAge: 30,
      retirementAge: 31,
      grossSalaryMonthly: 0,
      initialBalance: 0,
      secondPillarRate: 2,
      thirdPillar: { mode: 'fixedAnnual', annual: 9000 },
      annualReturnPercent: 0,
      fee: 0,
    });
    expect(result.thirdPillar).toBeCloseTo(THIRD_PILLAR_ANNUAL_TAX_CAP, 6);
  });

  it('does not grow a flat contribution with salary, unlike the percent mode', () => {
    const common = {
      currentAge: 30,
      retirementAge: 67,
      grossSalaryMonthly: 4000,
      initialBalance: 0,
      secondPillarRate: 2,
      annualReturnPercent: 0,
      fee: 0,
    } as const;
    // 15% of a 4000 gross exceeds the 500/month cap immediately, so the percent
    // saver hits 6000/year every year; a flat 300/month saver never does.
    const flat = project({ ...common, thirdPillar: { mode: 'fixedAnnual', annual: 3600 } });
    const percent = project({ ...common, thirdPillar: { mode: 'percentOfSalary', percent: 15 } });
    expect(flat.thirdPillar).toBeCloseTo(3600 * 37, 6);
    expect(percent.thirdPillar).toBeCloseTo(THIRD_PILLAR_ANNUAL_TAX_CAP * 37, 6);
    expect(percent.thirdPillar).toBeGreaterThan(flat.thirdPillar);
  });
});

describe('project — edge cases', () => {
  it('returns only the seed balance for someone already at retirement age', () => {
    const result = project({
      currentAge: 67,
      retirementAge: 67,
      grossSalaryMonthly: 2000,
      initialBalance: 42000,
      secondPillarRate: 6,
      thirdPillar: { mode: 'percentOfSalary', percent: 15 },
      annualReturnPercent: 7,
    });
    expect(result.total).toBe(42000);
    expect(result.secondPillar).toBe(42000);
    expect(result.thirdPillar).toBe(0);
  });

  it('flags an existing millionaire at their current age', () => {
    const result = project({
      currentAge: 55,
      retirementAge: 67,
      grossSalaryMonthly: 3000,
      initialBalance: 1_000_000,
      secondPillarRate: 6,
      thirdPillar: { mode: 'percentOfSalary', percent: 15 },
      annualReturnPercent: 7,
    });
    expect(result.millionaireAge).toBe(55);
  });

  it('extends past retirement to find the millionaire age when still growing', () => {
    const result = project({
      currentAge: 40,
      retirementAge: 67,
      grossSalaryMonthly: 1500,
      initialBalance: 100000,
      secondPillarRate: 2,
      thirdPillar: { mode: 'fixedAnnual', annual: 0 },
      annualReturnPercent: 7,
    });
    expect(result.total).toBeLessThan(1e6);
    expect(result.millionaireAge).not.toBeNull();
    const millionaireAge = result.millionaireAge as number;
    expect(millionaireAge).toBeGreaterThan(67);
    expect(millionaireAge).toBeLessThanOrEqual(101);
  });

  it('never reports a millionaire age when the money shrinks', () => {
    const result = project({
      currentAge: 40,
      retirementAge: 67,
      grossSalaryMonthly: 1500,
      initialBalance: 5000,
      secondPillarRate: 2,
      thirdPillar: { mode: 'fixedAnnual', annual: 0 },
      annualReturnPercent: -10,
    });
    expect(result.millionaireAge).toBeNull();
    expect(Number.isFinite(result.total)).toBe(true);
  });

  it('clamps catastrophic negative returns instead of producing NaN', () => {
    const result = project({
      currentAge: 30,
      retirementAge: 67,
      grossSalaryMonthly: 2000,
      initialBalance: 15000,
      secondPillarRate: 2,
      thirdPillar: { mode: 'percentOfSalary', percent: 0 },
      annualReturnPercent: -100,
    });
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('treats a 0% II rate as no contribution and no state top-up', () => {
    const result = project({
      currentAge: 30,
      retirementAge: 40,
      grossSalaryMonthly: 3000,
      initialBalance: 0,
      secondPillarRate: 0,
      thirdPillar: { mode: 'fixedAnnual', annual: 0 },
      annualReturnPercent: 0,
      fee: 0,
    });
    expect(result.secondPillar).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('buildComparison', () => {
  const inputs = {
    currentAge: 35,
    retirementAge: 67,
    grossSalaryMonthly: 2000,
    initialBalance: 15000,
    initialThirdPillarBalance: 0,
    currentSecondPillarRate: 2,
    currentThirdPillarMonthly: 0,
    annualReturnPercent: 7,
    currentFundFeePercent: 0,
    initialSavingsFundBalance: 0,
    savingsFundMonthly: 0,
    tulevaFee: TULEVA_FEE,
    savingsFundFee: TULEVA_FEE,
  };

  it('composes today vs Laura vs high-fee scenarios consistently with project()', () => {
    const comparison = buildComparison(inputs);

    const today = project({
      currentAge: 35,
      retirementAge: 67,
      grossSalaryMonthly: 2000,
      initialBalance: 15000,
      secondPillarRate: 2,
      thirdPillar: { mode: 'fixedAnnual', annual: 0 },
      annualReturnPercent: 7,
      fee: 0,
    });
    const laura = project({
      currentAge: 35,
      retirementAge: 67,
      grossSalaryMonthly: 2000,
      initialBalance: 15000,
      secondPillarRate: LAURA_SECOND_PILLAR_RATE,
      thirdPillar: { mode: 'fixedAnnual', annual: thirdPillarTaxCapMonthly(2000) * 12 },
      annualReturnPercent: 7,
      fee: TULEVA_FEE,
    });

    expect(comparison.today.total).toBeCloseTo(today.total, 6);
    expect(comparison.laura.total).toBeCloseTo(laura.total, 6);
    expect(comparison.gap).toBeCloseTo(laura.total - today.total, 6);
  });

  it('shows Laura ahead and a positive fee cost for an under-contributing saver', () => {
    const comparison = buildComparison(inputs);
    expect(comparison.gap).toBeGreaterThan(0);
    expect(comparison.feeCost).toBeGreaterThan(0);
    expect(comparison.laura.total).toBeGreaterThan(comparison.today.total);
    expect(comparison.lauraHighFee.total).toBeLessThan(comparison.laura.total);
  });

  it('matches Laura exactly when the saver already maxes both pillars', () => {
    const maxed = buildComparison({
      ...inputs,
      currentSecondPillarRate: 6,
      currentThirdPillarMonthly: thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly),
      currentFundFeePercent: TULEVA_FEE * 100,
    });
    // II 6% + III at the tax-advantaged ceiling AND Tuleva's fee IS Laura's recipe,
    // so the two projections coincide — no phantom "you could gain more" gap.
    // Regression: a flat-euro III used to overtake Laura's percent-of-salary III at
    // low incomes, making a fully-maxed saver appear to beat the recipe.
    expect(maxed.gap).toBeCloseTo(0, 6);
  });

  it('never lets the current course beat Laura across a wide input matrix', () => {
    [1000, 2000, 3500, 7000, 12000].forEach((grossSalaryMonthly) =>
      [2, 4, 6].forEach((currentSecondPillarRate) =>
        [0, 100, thirdPillarTaxCapMonthly(grossSalaryMonthly)].forEach(
          (currentThirdPillarMonthly) =>
            [-5, 0, 7].forEach((annualReturnPercent) => {
              const comparison = buildComparison({
                currentAge: 30,
                retirementAge: 65,
                grossSalaryMonthly,
                initialBalance: 20000,
                initialThirdPillarBalance: 0,
                currentSecondPillarRate,
                currentThirdPillarMonthly: Math.min(
                  currentThirdPillarMonthly,
                  thirdPillarTaxCapMonthly(grossSalaryMonthly),
                ),
                annualReturnPercent,
                // A realistic current fund fee (>= Tuleva's), so Laura stays the
                // ceiling: a lower fee is the one way a maxed saver could pull ahead.
                currentFundFeePercent: 0.5,
                // Savings fund money is identical under either course, so it cannot
                // tip the current course past Laura however large it is.
                initialSavingsFundBalance: 50000,
                savingsFundMonthly: 200,
                tulevaFee: TULEVA_FEE,
                savingsFundFee: TULEVA_FEE,
              });
              // Laura is the ceiling: within tax-capped inputs and a fee no lower than
              // Tuleva's, the saver can match her but never exceed her.
              expect(comparison.gap).toBeGreaterThanOrEqual(-1e-6);
            }),
        ),
      ),
    );
  });

  it('exposes both trajectories spanning current age to retirement age', () => {
    const comparison = buildComparison(inputs);
    expect(comparison.todayTrajectory[0]).toEqual({ age: 35, value: 15000 });
    expect(comparison.lauraTrajectory[0]).toEqual({ age: 35, value: 15000 });
    expect(comparison.todayTrajectory[comparison.todayTrajectory.length - 1].age).toBe(67);
    expect(comparison.lauraTrajectory[comparison.lauraTrajectory.length - 1].age).toBe(67);
  });

  const withSavingsFund = {
    ...inputs,
    initialSavingsFundBalance: 20000,
    savingsFundMonthly: 100,
  };

  it('counts the savings fund on both lines, leaving the recipe gap untouched', () => {
    const base = buildComparison(inputs);
    const withFund = buildComparison(withSavingsFund);

    // Savings fund money is the same under either course, so it lifts both lines by the
    // same amount: it grows the saver's assets without changing what the recipe is worth.
    expect(withFund.today.total - base.today.total).toBeCloseTo(
      withFund.laura.total - base.laura.total,
      6,
    );
    expect(withFund.gap).toBeCloseTo(base.gap, 6);
    expect(withFund.today.total).toBeGreaterThan(base.today.total);
    expect(withFund.lauraTrajectory[0]).toEqual({ age: 35, value: 35000 });
  });

  it("grows the savings fund at Tuleva's fee even when the saver's pension fund is expensive", () => {
    const expensive = { ...inputs, currentFundFeePercent: 1.5 };
    const grown = buildComparison({ ...expensive, initialSavingsFundBalance: 20000 });
    const base = buildComparison(expensive);

    // The savings fund IS a Tuleva index fund, so the fund-fee slider must not drag it:
    // 20 000 € compounds at 7% minus Tuleva's fee for the 32 years to retirement.
    const netReturn = 0.07 - TULEVA_FEE;
    expect(grown.today.total - base.today.total).toBeCloseTo(20000 * (1 + netReturn) ** 32, 6);
  });

  it('keeps compounding the savings fund after retirement when pension fees eat the return', () => {
    const comparison = buildComparison({
      ...inputs,
      currentAge: 60,
      retirementAge: 65,
      initialBalance: 0,
      currentSecondPillarRate: 0,
      currentThirdPillarMonthly: 0,
      annualReturnPercent: 7,
      // A fee above the return: the pension pot shrinks every year, but the savings
      // fund pays Tuleva's fee and still grows, so a million is reachable.
      currentFundFeePercent: 8,
      initialSavingsFundBalance: 100000,
    });

    expect(comparison.today.millionaireAge).not.toBeNull();
  });

  it('reaches a million sooner thanks to the savings fund', () => {
    const withoutFund = buildComparison(inputs);
    const withFund = buildComparison({ ...inputs, initialSavingsFundBalance: 100000 });

    expect(withFund.laura.millionaireAge).toBeLessThan(withoutFund.laura.millionaireAge as number);
  });
});
