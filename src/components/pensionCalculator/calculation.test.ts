import {
  accumulate,
  buildHistory,
  CalculatorInputs,
  INCOME_TAX_RATE,
  PastPayments,
  Pillars,
  project,
  projectedRemainingYears,
  projectedRetirementAge,
  SHORT_PERIOD_TAX_RATE,
  thirdPillarTaxCapMonthly,
} from './calculation';

const baseInputs: CalculatorInputs = {
  currentAge: 35,
  retirementAge: 65,
  grossSalaryMonthly: 2000,
  secondPillarRate: 2,
  secondPillarBalance: 10000,
  thirdPillarMonthly: 0,
  thirdPillarBalance: 0,
  savingsFundMonthly: 0,
  savingsFundBalance: 0,
  annualReturnPercent: 5,
  feePercent: 0.28,
  // Comfortably past the tax-free bar (23 years for a 35-year-old starting at 65),
  // so the drawdown tests see no pension tax unless they ask for it.
  withdrawalYears: 25,
  inflationPercent: 2.5,
  todaysMoney: false,
};

const inputs = (overrides: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  ...baseInputs,
  ...overrides,
});

describe('third pillar tax ceiling', () => {
  it('is 15% of gross while that is below the 6000 EUR annual cap', () => {
    expect(thirdPillarTaxCapMonthly(2000)).toBe(300);
  });

  it('is capped at 500 a month once 15% of gross would exceed 6000 a year', () => {
    expect(thirdPillarTaxCapMonthly(10000)).toBe(500);
  });
});

describe('accumulation', () => {
  it('adds the state 4% on top of the employee rate', () => {
    // With no return and no starting balance, a year of contributions is exactly
    // (rate + 4%) of twelve months of salary.
    const { points } = accumulate(
      inputs({
        currentAge: 64,
        annualReturnPercent: 0,
        feePercent: 0,
        secondPillarBalance: 0,
        secondPillarRate: 2,
      }),
    );
    expect(points[1].secondPillar).toBeCloseTo(2000 * 12 * 0.06, 6);
  });

  it('contributes nothing at all when the saver has left the II pillar', () => {
    const { points } = accumulate(
      inputs({ currentAge: 64, annualReturnPercent: 0, feePercent: 0, secondPillarRate: 0 }),
    );
    expect(points[1].secondPillar).toBeCloseTo(10000, 6);
  });

  it('charges the pension fee to the pillars but not to the savings fund', () => {
    // The savings fund is already a Tuleva index fund, so a pricey pension fund
    // must not drag it down: only the pillars feel the fee slider.
    const cheap = project(inputs({ feePercent: 0.28, savingsFundBalance: 10000 }));
    const pricey = project(inputs({ feePercent: 1.5, savingsFundBalance: 10000 }));

    expect(pricey.potAtRetirement.secondPillar).toBeLessThan(cheap.potAtRetirement.secondPillar);
    expect(pricey.potAtRetirement.savingsFund).toBeCloseTo(cheap.potAtRetirement.savingsFund, 6);
  });

  it('lets the savings fund fee be set on its own', () => {
    const base = project(inputs({ savingsFundBalance: 10000 }));
    const pricey = project(inputs({ savingsFundBalance: 10000, savingsFundFeePercent: 1.5 }));
    expect(pricey.potAtRetirement.savingsFund).toBeLessThan(base.potAtRetirement.savingsFund);
  });

  it('lets the saver pay into the III pillar above the tax cap', () => {
    const { points } = accumulate(
      inputs({
        currentAge: 64,
        annualReturnPercent: 0,
        feePercent: 0,
        thirdPillarMonthly: 800, // above the 500/month ceiling
      }),
    );
    expect(points[1].thirdPillar).toBeCloseTo(800 * 12, 6);
  });

  it('grows the salary 3% a year, so the second year contributes more', () => {
    const { points } = accumulate(
      inputs({ currentAge: 63, annualReturnPercent: 0, feePercent: 0, secondPillarBalance: 0 }),
    );
    const firstYear = points[1].secondPillar;
    const secondYear = points[2].secondPillar - points[1].secondPillar;
    expect(secondYear / firstYear).toBeCloseTo(1.03, 6);
  });
});

describe('fondipension drawdown', () => {
  it('pays out the whole pot and no more when the fund earns nothing', () => {
    const result = project(inputs({ annualReturnPercent: 0, feePercent: 0 }));
    expect(result.totalNetWithdrawn).toBeCloseTo(result.potAtRetirement.total, 4);
  });

  it('pays a flat amount every month when the fund earns nothing', () => {
    const result = project(inputs({ annualReturnPercent: 0, feePercent: 0 }));
    expect(result.lastPayment.net).toBeCloseTo(result.firstPayment.net, 6);
    expect(result.firstPayment.net).toBeCloseTo(
      result.potAtRetirement.total / result.withdrawalMonths,
      6,
    );
  });

  it('starts at pot / months, because a fondipension sells the same units each month', () => {
    const result = project(inputs());
    expect(result.firstPayment.gross).toBeCloseTo(
      result.potAtRetirement.total / result.withdrawalMonths,
      6,
    );
  });

  it('grows the payment with the fund, so the last is (1+r)^years times the first', () => {
    // Tuleva's own page makes this claim: at 7% over 19 years the final payment is
    // more than three times the first. 1.07^19 = 3.6.
    const result = project(inputs({ annualReturnPercent: 7, feePercent: 0, withdrawalYears: 19 }));
    const ratio = result.lastPayment.gross / result.firstPayment.gross;
    expect(ratio).toBeGreaterThan(3);
    // The last payment is at month 227, not 228, so it is one month short of a full 19 years.
    expect(ratio).toBeCloseTo(1.07 ** (227 / 12), 4);
  });

  it('runs for withdrawalYears * 12 months', () => {
    expect(project(inputs({ withdrawalYears: 19 })).withdrawalMonths).toBe(228);
    expect(project(inputs({ withdrawalYears: 10 })).withdrawalMonths).toBe(120);
  });
});

describe('withdrawal tax', () => {
  it('is untaxed over at least the remaining lifetime at the start age', () => {
    // A 35-year-old starting at 65: 19.3 years by today's table plus ~3.6 of
    // projected improvement over 30 years, so the bar is 23.
    const result = project(inputs({ withdrawalYears: 23 }));
    expect(result.pensionTaxRate).toBe(0);
    expect(result.firstPayment.tax).toBe(0);
    expect(result.firstPayment.net).toBeCloseTo(result.firstPayment.gross, 6);
  });

  it('stays untaxed over a longer-than-recommended duration', () => {
    expect(project(inputs({ withdrawalYears: 25 })).pensionTaxRate).toBe(0);
  });

  it('asks for a longer payout the earlier the money starts moving', () => {
    expect(projectedRemainingYears(65, 0)).toBe(19);
    expect(projectedRemainingYears(60, 0)).toBe(23);
    expect(projectedRemainingYears(70, 0)).toBe(16);
  });

  it('grows the remaining lifetime with the years until the start', () => {
    expect(projectedRemainingYears(65, 30)).toBe(23);
    expect(projectedRemainingYears(69, 34)).toBe(20);
  });

  it('measures the payout period against the remaining lifetime at the start age', () => {
    // A 35-year-old starting at 60 has ~26 projected years left, so 20 is short;
    // starting at 70 leaves ~20, so 20 is exactly the bar.
    expect(project(inputs({ retirementAge: 60, withdrawalYears: 20 })).pensionTaxRate).toBe(
      SHORT_PERIOD_TAX_RATE,
    );
    expect(project(inputs({ retirementAge: 70, withdrawalYears: 20 })).pensionTaxRate).toBe(0);
  });

  it('taxes the whole stream at 10% when taken faster than recommended', () => {
    const result = project(inputs({ withdrawalYears: 10 }));
    expect(result.pensionTaxRate).toBe(SHORT_PERIOD_TAX_RATE);
    expect(result.firstPayment.net).toBeCloseTo(result.firstPayment.gross * 0.9, 6);
  });

  it('does not tax savings fund withdrawals until they exceed what was paid in', () => {
    // An investeerimiskonto is taxed only once withdrawals pass the basis, so the
    // first payments come out clean whatever the pension pillars are doing.
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        savingsFundBalance: 10000,
        savingsFundMonthly: 100,
        withdrawalYears: 10, // short, so any pension tax would show up
      }),
    );
    expect(result.firstPayment.tax).toBe(0);
    expect(result.lastPayment.tax).toBeGreaterThan(0);
  });

  it('taxes existing gains: a balance above the paid-in basis is not tax-free principal', () => {
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        savingsFundBalance: 10000,
        savingsFundBasis: 8000,
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );
    expect(result.totalTax).toBeCloseTo(2000 * INCOME_TAX_RATE, 2);
  });

  it('defaults the basis to the balance when none is given', () => {
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        savingsFundBalance: 10000,
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );
    expect(result.totalTax).toBeCloseTo(0, 6);
  });

  it('taxes savings fund gains at the income tax rate once the basis is used up', () => {
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        savingsFundBalance: 100000,
        savingsFundMonthly: 0,
        annualReturnPercent: 5,
        feePercent: 0,
      }),
    );
    // Basis is 100 000; everything drawn beyond that is gain, taxed at 22%. Note
    // the gross drawn exceeds the pot at retirement, because the undrawn part
    // keeps earning right through the drawdown.
    expect(result.totalGrossWithdrawn).toBeGreaterThan(result.potAtRetirement.total);
    expect(result.totalTax).toBeCloseTo((result.totalGrossWithdrawn - 100000) * INCOME_TAX_RATE, 2);
  });

  it('keeps the savings fund tax out of the figure that prices the payout period', () => {
    // A saver with nothing but savings-fund money owes no pension tax at all, so
    // shortening the period costs them nothing — even though they do owe 22% on
    // their gains. Quoting the combined total here would blame the slider for a
    // bill it did not cause.
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        savingsFundBalance: 100000,
        withdrawalYears: 10,
      }),
    );
    expect(result.pensionTaxRate).toBe(SHORT_PERIOD_TAX_RATE);
    expect(result.pensionTax).toBe(0);
    expect(result.savingsFundTax).toBeGreaterThan(0);
    expect(result.totalTax).toBeCloseTo(result.pensionTax + result.savingsFundTax, 6);
  });

  it('prices the payout period with the pension tax alone', () => {
    const result = project(inputs({ secondPillarBalance: 100000, withdrawalYears: 10 }));
    expect(result.pensionTax).toBeGreaterThan(0);
    expect(result.savingsFundTax).toBe(0);
  });
});

describe('third pillar tax refund', () => {
  it('refunds 22% of contributions up to the ceiling', () => {
    const result = project(inputs({ grossSalaryMonthly: 2000, thirdPillarMonthly: 100 }));
    expect(result.thirdPillarAnnualRefund).toBeCloseTo(100 * 12 * 0.22, 6);
  });

  it('refunds nothing extra above 15% of gross', () => {
    // 15% of 2000 is 300 a month, so paying 400 earns the same refund as paying 300.
    const atCap = project(inputs({ grossSalaryMonthly: 2000, thirdPillarMonthly: 300 }));
    const aboveCap = project(inputs({ grossSalaryMonthly: 2000, thirdPillarMonthly: 400 }));
    expect(aboveCap.thirdPillarAnnualRefund).toBeCloseTo(atCap.thirdPillarAnnualRefund, 6);
  });

  it('refunds no more than 22% of 6000 however high the salary', () => {
    const result = project(inputs({ grossSalaryMonthly: 20000, thirdPillarMonthly: 1000 }));
    expect(result.thirdPillarAnnualRefund).toBeCloseTo(6000 * 0.22, 6);
  });
});

describe("today's money", () => {
  it('discounts the pot by inflation over the years to retirement', () => {
    const nominal = project(inputs({ todaysMoney: false }));
    const real = project(inputs({ todaysMoney: true }));
    expect(real.potAtRetirement.total).toBeCloseTo(nominal.potAtRetirement.total / 1.025 ** 30, 4);
  });

  it('leaves a pot untouched when there is no time left to discount over', () => {
    const real = project(inputs({ currentAge: 65, todaysMoney: true }));
    const nominal = project(inputs({ currentAge: 65, todaysMoney: false }));
    expect(real.potAtRetirement.total).toBeCloseTo(nominal.potAtRetirement.total, 6);
  });

  it('still grows payments in real terms while the return beats inflation', () => {
    const real = project(inputs({ annualReturnPercent: 5, feePercent: 0, todaysMoney: true }));
    expect(real.lastPayment.net).toBeGreaterThan(real.firstPayment.net);
  });

  it('shrinks payments in real terms when inflation beats the return', () => {
    const real = project(
      inputs({ annualReturnPercent: 1, feePercent: 0, inflationPercent: 4, todaysMoney: true }),
    );
    expect(real.lastPayment.net).toBeLessThan(real.firstPayment.net);
  });
});

describe('timeline', () => {
  it('covers accumulation and drawdown, ending at zero', () => {
    const result = project(inputs({ withdrawalYears: 19 }));
    expect(result.timeline[0].age).toBe(35);
    expect(result.timeline[result.timeline.length - 1].age).toBe(84);
    expect(result.timeline[result.timeline.length - 1].total).toBe(0);
  });

  it('peaks at retirement', () => {
    // Over a short-enough drawdown the payout rate outpaces the 5% growth; a much
    // longer one would keep the pot growing past retirement for a while.
    const result = project(inputs({ withdrawalYears: 19 }));
    const peak = result.timeline.reduce((a, b) => (b.total > a.total ? b : a));
    expect(peak.age).toBe(65);
    expect(peak.total).toBeCloseTo(result.potAtRetirement.total, 6);
  });

  it('has no gap or duplicate where the two phases meet', () => {
    const ages = project(inputs()).timeline.map((point) => point.age);
    expect(ages).toEqual(Array.from(new Set(ages)));
    ages.forEach((age, index) => {
      if (index > 0) {
        expect(age - ages[index - 1]).toBe(1);
      }
    });
  });
});

describe('edge cases', () => {
  it('anchors the drawdown at today for a saver already past the age they picked', () => {
    // Ages must never run backwards, whatever the sliders say.
    const result = project(inputs({ currentAge: 70, retirementAge: 65 }));
    const ages = result.timeline.map((point) => point.age);
    expect(Math.min(...ages)).toBe(70);
    expect(result.yearsToRetirement).toBe(0);
    ages.forEach((age, index) => {
      if (index > 0) {
        expect(age).toBeGreaterThan(ages[index - 1]);
      }
    });
  });

  it('survives a saver who is already at retirement age', () => {
    const result = project(inputs({ currentAge: 65 }));
    expect(result.yearsToRetirement).toBe(0);
    expect(result.potAtRetirement.total).toBeCloseTo(10000, 6);
    expect(Number.isFinite(result.firstPayment.net)).toBe(true);
  });

  it('survives an empty saver with nothing saved and nothing coming in', () => {
    const result = project(
      inputs({
        secondPillarRate: 0,
        secondPillarBalance: 0,
        thirdPillarBalance: 0,
        savingsFundBalance: 0,
      }),
    );
    expect(result.potAtRetirement.total).toBe(0);
    expect(result.firstPayment.net).toBe(0);
    expect(result.totalNetWithdrawn).toBe(0);
  });

  it('survives a negative return without producing a negative pot', () => {
    const result = project(inputs({ annualReturnPercent: -5 }));
    expect(result.potAtRetirement.total).toBeGreaterThan(0);
    expect(result.firstPayment.net).toBeGreaterThan(0);
  });
});

describe('history', () => {
  const now = new Date('2026-07-01T00:00:00Z');
  const payment = (time: string, amount: number) => ({ time, amount });
  const none: PastPayments = {
    secondPillar: [],
    thirdPillar: [],
    savingsFund: [],
    memberCapital: [],
  };
  const balances = (
    overrides: Partial<Pillars & { memberCapital: number }> = {},
  ): Pillars & { memberCapital: number } => ({
    secondPillar: 0,
    thirdPillar: 0,
    savingsFund: 0,
    memberCapital: 0,
    ...overrides,
  });

  it('starts one point before the first contribution, at zero', () => {
    const points = buildHistory(
      { ...none, secondPillar: [payment('2020-03-10T00:00:00Z', 100)] },
      balances({ secondPillar: 1000 }),
      35,
      now,
    );

    expect(points.map((point) => point.age)).toEqual([28, 29, 30, 31, 32, 33, 34]);
    expect(points[0]).toEqual({
      age: 28,
      secondPillar: 0,
      thirdPillar: 0,
      savingsFund: 0,
      memberCapital: 0,
      total: 0,
    });
  });

  it("scales cumulative contributions so the history lands on today's balance", () => {
    // Two equal payments; the balance is double what was paid in, so every point doubles.
    const points = buildHistory(
      {
        ...none,
        secondPillar: [payment('2023-01-15T00:00:00Z', 100), payment('2025-01-15T00:00:00Z', 100)],
      },
      balances({ secondPillar: 400 }),
      35,
      now,
    );

    expect(points.find((point) => point.age === 33)?.secondPillar).toBe(200);
    expect(points[points.length - 1].secondPillar).toBe(400);
  });

  it('draws no history for a bucket whose money has since left', () => {
    const points = buildHistory(
      {
        ...none,
        secondPillar: [payment('2020-03-10T00:00:00Z', 100)],
        thirdPillar: [payment('2024-05-01T00:00:00Z', 50)],
      },
      balances({ thirdPillar: 100 }),
      35,
      now,
    );

    // The emptied II pillar neither draws nor anchors the start: the chart begins
    // where the III pillar money begins.
    expect(points.map((point) => point.age)).toEqual([32, 33, 34]);
    expect(points.every((point) => point.secondPillar === 0)).toBe(true);
  });

  it('returns nothing when no bucket has both payments and a balance today', () => {
    expect(buildHistory(none, balances({ secondPillar: 1000 }), 35, now)).toEqual([]);
    expect(
      buildHistory(
        { ...none, secondPillar: [payment('2020-01-01T00:00:00Z', 100)] },
        balances(),
        35,
        now,
      ),
    ).toEqual([]);
  });

  it('draws no history for a bucket whose corrections nearly cancel the paid-in total', () => {
    // +10 000 then a −9990 correction with 500 € left today: the scale factor would
    // be 50, and the years in between would show a phantom half a million.
    const points = buildHistory(
      {
        ...none,
        thirdPillar: [
          payment('2018-01-10T00:00:00Z', 10000),
          payment('2022-01-10T00:00:00Z', -9990),
        ],
      },
      balances({ thirdPillar: 500 }),
      35,
      now,
    );

    expect(points).toEqual([]);
  });

  it('never dips below zero when corrections post negative rows', () => {
    const points = buildHistory(
      {
        ...none,
        secondPillar: [payment('2022-01-10T00:00:00Z', -50), payment('2024-01-10T00:00:00Z', 250)],
      },
      balances({ secondPillar: 200 }),
      35,
      now,
    );

    expect(points.every((point) => point.secondPillar >= 0)).toBe(true);
  });

  it('never walks back past age zero', () => {
    const points = buildHistory(
      { ...none, secondPillar: [payment('1990-01-01T00:00:00Z', 100)] },
      balances({ secondPillar: 100 }),
      20,
      now,
    );

    expect(points[0].age).toBe(0);
  });

  it('draws member capital climbing over its own event history', () => {
    const points = buildHistory(
      {
        ...none,
        memberCapital: [payment('2023-01-15T00:00:00Z', 100), payment('2025-01-15T00:00:00Z', 100)],
      },
      balances({ memberCapital: 200 }),
      35,
      now,
    );

    // Two equal events, balance equal to what was paid in, so the band lands on 100 once
    // the first event is in and on the full 200 by the last recorded year.
    expect(points.find((point) => point.age === 33)?.memberCapital).toBe(100);
    expect(points[points.length - 1].memberCapital).toBe(200);
    // A member-capital-only past still counts toward the stacked total.
    expect(points[points.length - 1].total).toBe(200);
  });
});

describe('projected retirement age and payout period', () => {
  it('stays at the statutory 65 for cohorts already on established ages', () => {
    expect(projectedRetirementAge(1961)).toBe(65);
    expect(projectedRetirementAge(1963)).toBe(65);
  });

  it('creeps up about 1.5 months per birth year under the life-expectancy link', () => {
    expect(projectedRetirementAge(1991)).toBe(69);
    expect(projectedRetirementAge(2005)).toBe(70);
  });
});

describe('max utility payout: annual renewal at the shortest tax-free period', () => {
  it('pays more than the 4% rule at every age and spends the pot down by 100', () => {
    const fourPercent = project(
      inputs({
        payoutStrategy: 'fourPercentRule',
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );
    const maxUtility = project(
      inputs({
        payoutStrategy: 'maxUtility',
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );

    // The shortest legal period (23 years at 65 here) beats the 4% rule's 25.
    expect(maxUtility.firstPayment.gross).toBeCloseTo(
      maxUtility.potAtRetirement.total / (12 * 23),
      6,
    );
    expect(maxUtility.firstPayment.gross).toBeGreaterThan(fourPercent.firstPayment.gross);
    expect(maxUtility.pensionTaxRate).toBe(0);

    // Consumption, not inheritance: only a sliver is left at the horizon.
    const leftover = maxUtility.timeline[maxUtility.timeline.length - 1].total;
    expect(leftover).toBeLessThan(maxUtility.potAtRetirement.total * 0.1);
    expect(leftover).toBeLessThan(fourPercent.timeline[fourPercent.timeline.length - 1].total);
  });
});

describe('smart payout: annual renewal on the 4% rule', () => {
  it('is tax free by construction and still holds money at 100', () => {
    const result = project(
      inputs({
        payoutStrategy: 'fourPercentRule',
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );

    expect(result.pensionTaxRate).toBe(0);
    const last = result.timeline[result.timeline.length - 1];
    expect(last.age).toBe(100);
    expect(last.total).toBeGreaterThan(0);
  });

  it('takes out about 4% of the balance a year', () => {
    const result = project(
      inputs({
        payoutStrategy: 'fourPercentRule',
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );
    // At 65 the tax-free minimum (23 years for this saver) is below 25, so the
    // renewal period is the 4% rule's 25 years: 1/300 of the pot a month.
    expect(result.firstPayment.gross).toBeCloseTo(result.potAtRetirement.total / 300, 6);
  });

  it('stretches the period for an early retiree whose tax-free minimum exceeds 25 years', () => {
    const result = project(
      inputs({
        payoutStrategy: 'fourPercentRule',
        retirementAge: 60,
        annualReturnPercent: 0,
        feePercent: 0,
        savingsFundFeePercent: 0,
      }),
    );
    // Remaining lifetime at 60, twenty-five years out, is 27 years, above 25.
    expect(result.firstPayment.gross).toBeCloseTo(result.potAtRetirement.total / (12 * 27), 6);
  });

  it('grows both the payments and the inheritance when the return beats the 4% withdrawal', () => {
    const result = project(
      inputs({
        payoutStrategy: 'fourPercentRule',
        annualReturnPercent: 7,
        feePercent: 0,
        savingsFundFeePercent: 0,
        todaysMoney: false,
      }),
    );

    expect(result.lastPayment.net).toBeGreaterThan(result.firstPayment.net);
    const last = result.timeline[result.timeline.length - 1];
    expect(last.total).toBeGreaterThan(result.potAtRetirement.total);
  });
});

describe('member capital', () => {
  it('gives a non-member no member capital anywhere in the timeline', () => {
    const { timeline } = project(inputs());

    expect(timeline.every((point) => point.memberCapital === 0)).toBe(true);
  });

  it('seeds the band from the current book value', () => {
    const { timeline } = project(inputs({ memberCapitalBalance: 1000 }));

    expect(timeline[0].memberCapital).toBe(1000);
  });

  it('adds a yearly bonus of 0.05% of the whole Tuleva balance', () => {
    // One year, no growth and no fee, so only the bonus moves the balance; a rate of
    // 0 means no new pillar contributions, so the 100 000 € balance is the whole base.
    const { timeline } = project(
      inputs({
        currentAge: 40,
        retirementAge: 41,
        secondPillarRate: 0,
        secondPillarBalance: 100000,
        thirdPillarBalance: 0,
        savingsFundBalance: 0,
        annualReturnPercent: 0,
        feePercent: 0,
        memberCapitalBalance: 0,
      }),
    );

    // 0.05% of 100 000 = 50, credited once after the first year.
    expect(timeline.find((point) => point.age === 41)?.memberCapital).toBeCloseTo(50, 6);
  });

  it('compounds member capital at the market return, like a pension fund', () => {
    // No pillars, so no bonus; 10% for a year isolates the growth on the seed.
    const { timeline } = project(
      inputs({
        currentAge: 40,
        retirementAge: 41,
        secondPillarRate: 0,
        secondPillarBalance: 0,
        thirdPillarBalance: 0,
        savingsFundBalance: 0,
        annualReturnPercent: 10,
        feePercent: 0,
        memberCapitalBalance: 1000,
      }),
    );

    expect(timeline.find((point) => point.age === 41)?.memberCapital).toBeCloseTo(1100, 0);
  });

  it('draws member capital down into the pot and the monthly payment', () => {
    const member = project(
      inputs({
        memberCapitalBalance: 5000,
        memberCapitalBasis: 5000,
        payoutStrategy: 'fixedPeriod',
      }),
    );
    const nonMember = project(inputs({ payoutStrategy: 'fixedPeriod' }));

    // Member capital is part of the drawable pot and lifts the monthly payment.
    expect(member.potAtRetirement.total).toBeGreaterThan(nonMember.potAtRetirement.total);
    expect(member.firstPayment.net).toBeGreaterThan(nonMember.firstPayment.net);
    // The classic contract spends it like everything else: nothing left to inherit.
    expect(member.timeline[member.timeline.length - 1].total).toBeCloseTo(0, 6);
  });

  it('taxes member capital gains above the own-contribution basis at 22%', () => {
    // With the whole own contribution deductible, only the bonuses and market growth on
    // top are taxed; with no deductible basis the whole drawdown is taxed.
    const withBasis = project(inputs({ memberCapitalBalance: 5000, memberCapitalBasis: 5000 }));
    const noBasis = project(inputs({ memberCapitalBalance: 5000, memberCapitalBasis: 0 }));

    expect(withBasis.memberCapitalTax).toBeGreaterThan(0);
    expect(noBasis.memberCapitalTax).toBeGreaterThan(withBasis.memberCapitalTax);
    // A non-member owes no member-capital tax at all.
    expect(project(inputs()).memberCapitalTax).toBe(0);
  });
});
