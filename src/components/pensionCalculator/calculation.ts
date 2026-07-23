// Pure projection maths for the public pension calculator: accumulation to
// retirement, then a fondipension drawdown over a fixed number of years.
//
// Two phases, one timeline. Everything here is plain arithmetic with no React
// and no I/O, so it can be unit-tested on its own (see calculation.test.ts).
//
// The drawdown model is the part worth reading. A fondipension redeems
// `remaining units / remaining months` each month, which collapses to a
// constant number of units per month:
//
//   u_m = U_m / (M - m)  and  U_{m+1} = U_m - u_m
//   =>   U_m = U_0 * (M - m) / M   =>   u_m = U_0 / M   for every m
//
// So the saver sells the same slice of the fund every month, and the euro
// payment grows exactly with the unit price. That is why Tuleva's own page can
// say the last payment is ~3x the first at 7% over 19 years: 1.07^19 = 3.6.

export const RETIREMENT_AGE_DEFAULT = 65; // 2026; rises with life expectancy from 2027

// From 2027 the statutory retirement age is linked to life expectancy at 65, capped
// at 3 months a year; only 2027 (65y1m) and 2028 (65y3m) are established, and the
// Ministry of Finance's own long-run estimate of the pace is 1-2 months per birth
// year. The prefill uses the midpoint of that estimate - a best guess for the slider
// to start from, clearly the saver's to change, never a promise.
// Source: pensionikeskus.ee "Pensioniiga tana ja tulevikus", checked 2026-07.
const RETIREMENT_AGE_LINK_BASE_BIRTH_YEAR = 1962; // first cohort on the linked age
const RETIREMENT_AGE_LINK_MONTHS_PER_YEAR = 1.5;

export function projectedRetirementAge(birthYear: number): number {
  const linkedYears = Math.max(0, birthYear - RETIREMENT_AGE_LINK_BASE_BIRTH_YEAR);
  return Math.round(65 + (linkedYears * RETIREMENT_AGE_LINK_MONTHS_PER_YEAR) / 12);
}

// ONE life-expectancy model, used for the payout default, the tax-free bar and the
// renewal strategies alike, so the page never quotes two different "remaining
// lifetime" numbers.
//
// Statistikaamet's period life table (unisex remaining years, interpolated between
// five-year anchors). A straight line fitted at 60-75 would overstate remaining
// life in the 80s and understate it near 100, which turned the renewal strategies'
// tail payments into noise; the real table flattens toward a floor instead.
const REMAINING_YEARS_BY_AGE: [number, number][] = [
  [60, 23.0],
  [65, 19.3],
  [70, 15.6],
  [75, 12.3],
  [80, 9.4],
  [85, 6.9],
  [90, 4.9],
  [95, 3.4],
  [100, 2.4],
];
const LIFE_EXPECTANCY_AT_65 = 19.3;
// Eurostat's EUROPOP2023 baseline for Estonia gains roughly 1.2 years a decade at
// 65. Applied PROPORTIONALLY (about +6% a decade), not as absolute years: old-age
// mortality improves fewer years per decade than 65-year-olds' does, and adding a
// flat 1.2/decade would hand a 99-year-old an absurd decade of extra life.
const RELATIVE_LIFE_EXPECTANCY_GAIN_PER_DECADE = 1.2 / LIFE_EXPECTANCY_AT_65;

const remainingYearsToday = (age: number): number => {
  const first = REMAINING_YEARS_BY_AGE[0];
  const last = REMAINING_YEARS_BY_AGE[REMAINING_YEARS_BY_AGE.length - 1];
  if (age <= first[0]) {
    return first[1];
  }
  if (age >= last[0]) {
    return last[1];
  }
  const upper = REMAINING_YEARS_BY_AGE.findIndex(([anchorAge]) => anchorAge >= age);
  const [lowerAge, lowerYears] = REMAINING_YEARS_BY_AGE[upper - 1];
  const [upperAge, upperYears] = REMAINING_YEARS_BY_AGE[upper];
  return lowerYears + ((upperYears - lowerYears) * (age - lowerAge)) / (upperAge - lowerAge);
};

export function projectedRemainingYears(retirementAge: number, yearsToRetirement: number): number {
  return Math.round(
    remainingYearsToday(retirementAge) *
      (1 + (Math.max(0, yearsToRetirement) * RELATIVE_LIFE_EXPECTANCY_GAIN_PER_DECADE) / 10),
  );
}

// Renewal strategies: instead of one fixed-period contract, sign a NEW
// fondipension contract every year. The variants differ only in the period:
//
// - fourPercentRule: max(25 years, the tax-free minimum), which pays out about
//   4% of the CURRENT balance a year. The percent-of-portfolio (endowment)
//   cousin of Bengen's 4% rule, not the classic rule itself — a fondipension
//   can only pay units/months, so constant-euro withdrawals are not available
//   tax free. Income floats with the market, the pot can never deplete, and
//   the principal is left as an inheritance.
// - maxUtility: the tax-free minimum itself (your remaining statistical
//   lifetime), which is also how Tuleva's own withdrawals flow sets a contract
//   up today. The biggest legal tax-free payment at every age; the pot is
//   consumed over your own lifetime.
//
// Both are tax free by construction and drawn to the age-100 horizon.
export type PayoutStrategy = 'fixedPeriod' | 'fourPercentRule' | 'maxUtility';

export const SMART_PAYOUT_HORIZON_AGE = 100;
const FOUR_PERCENT_RULE_YEARS = 25;

const renewalYears = (strategy: PayoutStrategy, age: number, currentAge: number): number => {
  const remaining = Math.max(1, projectedRemainingYears(age, age - currentAge));
  return strategy === 'fourPercentRule' ? Math.max(FOUR_PERCENT_RULE_YEARS, remaining) : remaining;
};
// 0, not a historical average: the calculator must never open on an assumed positive
// return (Finantsinspektsioon guidance; same rule as the millionaire calculator).
// The saver raises the slider themselves.
export const DEFAULT_RETURN_PERCENT = 0;
// The ECB's symmetric 2% target — the only official long-run anchor. Estonia has
// historically run a point or so hotter (price-level convergence), which the saver
// can model with the slider; the default sticks to the number the ECB commits to.
export const DEFAULT_INFLATION_PERCENT = 2;
// 3% nominal, the same assumption the millionaire calculator and Tuleva's own
// II pillar calculator use. Stated on the page, not hidden.
export const SALARY_GROWTH = 0.03;
export const TULEVA_FEE = 0.0028;
// Weighted average ongoing charges of Estonian II pillar funds. Source: Tuleva's
// own published comparison, checked 2026-07. Rendered publicly as a comparative
// claim, so re-check it against pensionikeskus.ee before each campaign.
export const ESTONIAN_AVERAGE_FEE = 0.0083;

// The state adds 4% of gross out of the social tax already paid on that salary.
// It is the same 4% whichever rate the employee picks — 2, 4 or 6.
export const STATE_SECOND_PILLAR_TOP_UP = 4;
export const SECOND_PILLAR_RATES = [2, 4, 6];

// Tuleva's liikmeboonus: a member earns 0.05% of their whole Tuleva balance (II, III
// and savings fund together) into member capital each year. Modelled at book value —
// the sum contributed, not the ~1.3x fair value the cooperative's equity trades at —
// so the projection never talks up the price of Tuleva's own shares to a member.
export const MEMBERSHIP_BONUS_RATE = 0.0005;

export const THIRD_PILLAR_ANNUAL_TAX_CAP = 6000;
export const THIRD_PILLAR_TAX_DEDUCTIBLE_RATE = 0.15;
/** The most anyone can pay in a month and still earn a refund on all of it. */
export const MAX_THIRD_PILLAR_MONTHLY = THIRD_PILLAR_ANNUAL_TAX_CAP / 12;
// 22% from January 2025; the planned rise to 24% was repealed in December 2025.
// Source: emta.ee/uudised/maksumuudatused-2026, checked 2026-07.
export const INCOME_TAX_RATE = 0.22;

// A fondipension paid over at least the recommended duration, at least once a
// quarter, is untaxed. Take it faster and the whole stream is taxed at 10%.
export const SHORT_PERIOD_TAX_RATE = 0.1;

export const MAX_SALARY = 100000;

export function thirdPillarTaxCapMonthly(grossSalaryMonthly: number): number {
  return Math.min(
    THIRD_PILLAR_TAX_DEDUCTIBLE_RATE * grossSalaryMonthly,
    THIRD_PILLAR_ANNUAL_TAX_CAP / 12,
  );
}

export interface CalculatorInputs {
  currentAge: number;
  retirementAge: number;
  grossSalaryMonthly: number;
  /** 0 means the saver is not in the funded II pillar: no contribution, no state top-up. */
  secondPillarRate: number;
  secondPillarBalance: number;
  thirdPillarMonthly: number;
  thirdPillarBalance: number;
  savingsFundMonthly: number;
  savingsFundBalance: number;
  /** What was actually paid into the savings fund, net of withdrawals. Under an
   *  investeerimiskonto only the part of a withdrawal above this is taxed, so a
   *  balance that already contains gains must not all count as tax-free principal.
   *  Defaults to the balance (no gains yet). */
  savingsFundBasis?: number;
  /** The member's member capital (liikmekapital) today, at book value — the sum of
   *  their capital contributions, not the ~1.3x fair value. `undefined` for a
   *  non-member: no band, no bonus. A member earns MEMBERSHIP_BONUS_RATE of their
   *  whole Tuleva balance each year, and the pot rides the market like a pension fund
   *  but is never drawn down as pension — it is left as an inheritance. */
  memberCapitalBalance?: number;
  /** The part of member capital deductible from the tax base on drawdown: only the
   *  member's own capital contributions (kapitali panus). Bonuses, work compensation
   *  and market growth are all taxed at 22%, like the savings fund. Defaults to 0, so
   *  nothing is deductible unless the caller knows the own-contribution total. */
  memberCapitalBasis?: number;
  /** How the fondipension is signed: one fixed-period contract (the default), or
   *  renewed yearly under one of the strategies above. When renewing,
   *  `withdrawalYears` is ignored and the drawdown is drawn to age 100. */
  payoutStrategy?: PayoutStrategy;
  annualReturnPercent: number;
  /** Annual fee on the pension pillars, in percent. */
  feePercent: number;
  /** Annual fee on the savings fund. Defaults to Tuleva's, since that money is
   *  at Tuleva whatever the saver's pension funds charge. */
  savingsFundFeePercent?: number;
  withdrawalYears: number;
  inflationPercent?: number;
  /** Restate every euro figure in today's money. The honest default for a 30-year horizon. */
  todaysMoney?: boolean;
}

export interface Pillars {
  secondPillar: number;
  thirdPillar: number;
  savingsFund: number;
}

export interface TimelinePoint extends Pillars {
  age: number;
  /** Member capital (liikmekapital), tracked alongside the pillars but never drawn
   *  down as pension. Zero for a non-member and across the recorded past. */
  memberCapital: number;
  total: number;
}

export interface MonthlyPayment extends Pillars {
  /** Member capital drawn this month, like a savings-fund unit sale. */
  memberCapital: number;
  /** Before tax. */
  gross: number;
  tax: number;
  /** What actually lands in the saver's account. */
  net: number;
}

export interface Projection {
  /** The pension pot at retirement. `total` is the drawable pension only (second +
   *  third + savings); `memberCapital` is carried alongside so callers can show total
   *  wealth without it leaking into the payment maths. */
  potAtRetirement: Pillars & { total: number; memberCapital: number };
  yearsToRetirement: number;
  withdrawalMonths: number;
  firstPayment: MonthlyPayment;
  lastPayment: MonthlyPayment;
  /** Mean net monthly payment across the whole drawdown. */
  averageNetPayment: number;
  /** Everything paid out over the period, after tax. */
  totalNetWithdrawn: number;
  /** Everything paid out over the period, before tax. Exceeds the pot: the undrawn
   *  remainder stays invested and keeps earning throughout the drawdown. */
  totalGrossWithdrawn: number;
  /** Income tax paid across the whole drawdown, both kinds together. */
  totalTax: number;
  /** The 10% the payout period costs when it is shorter than recommended. Zero at
   *  or above the recommended duration. This is the figure to quote when warning
   *  about the period, since the savings-fund tax below is owed either way. */
  pensionTax: number;
  /** Income tax on savings-fund gains, owed whatever payout period is chosen. */
  savingsFundTax: number;
  /** Income tax on member-capital gains (everything above the member's own capital
   *  contributions), owed whatever payout period is chosen. */
  memberCapitalTax: number;
  /** 0 when the period is at least the recommended duration, otherwise 10%. */
  pensionTaxRate: number;
  /** The tax-free bar the period is measured against: the statistical remaining
   *  lifetime at the age withdrawals start. */
  recommendedYears: number;
  /** Income tax refunded each year on III pillar contributions, at today's salary. */
  thirdPillarAnnualRefund: number;
  timeline: TimelinePoint[];
  todaysMoney: boolean;
}

const monthlyRate = (annualRate: number): number =>
  (1 + Math.max(annualRate, -0.99)) ** (1 / 12) - 1;

/** Fee comes off the annual return arithmetically, matching the millionaire calculator. */
const netAnnualReturn = (annualReturnPercent: number, feePercent: number): number =>
  annualReturnPercent / 100 - feePercent / 100;

/** The saver's own pension fund fee, which the fee slider drives. */
export const pensionFee = (inputs: CalculatorInputs): number => inputs.feePercent;

/**
 * The savings fund charges its own fee whatever the saver's pension funds charge:
 * that money is at Tuleva either way. Letting the pension slider drag it down too
 * would overstate what switching pension funds is worth.
 */
export const savingsFundFee = (inputs: CalculatorInputs): number =>
  inputs.savingsFundFeePercent ?? TULEVA_FEE * 100;

export function accumulate(inputs: CalculatorInputs): {
  points: TimelinePoint[];
  savingsFundBasis: number;
} {
  const monthlyReturn = monthlyRate(
    netAnnualReturn(inputs.annualReturnPercent, pensionFee(inputs)),
  );
  const savingsMonthlyReturn = monthlyRate(
    netAnnualReturn(inputs.annualReturnPercent, savingsFundFee(inputs)),
  );
  const contributionRate =
    inputs.secondPillarRate > 0 ? (inputs.secondPillarRate + STATE_SECOND_PILLAR_TOP_UP) / 100 : 0;

  let salary = inputs.grossSalaryMonthly;
  let secondPillar = inputs.secondPillarBalance;
  let thirdPillar = inputs.thirdPillarBalance;
  let savingsFund = inputs.savingsFundBalance;
  // Money paid into the savings fund. Under an investeerimiskonto this is the
  // basis: withdrawals are untaxed until they exceed it.
  let savingsFundBasis = inputs.savingsFundBasis ?? inputs.savingsFundBalance;
  // Members carry a fourth pot: no member capital number means a non-member, and the
  // whole band stays at zero.
  const isMember = inputs.memberCapitalBalance !== undefined;
  let memberCapital = inputs.memberCapitalBalance ?? 0;

  const points: TimelinePoint[] = [
    {
      age: inputs.currentAge,
      secondPillar,
      thirdPillar,
      savingsFund,
      memberCapital,
      total: secondPillar + thirdPillar + savingsFund + memberCapital,
    },
  ];

  const retirementAge = Math.max(inputs.retirementAge, inputs.currentAge);

  for (let age = inputs.currentAge; age < retirementAge; age += 1) {
    // Not clamped to the tax cap: paying in above 15% of gross or EUR 6000 earns
    // no refund, but the money still goes in and still gets the 0% withdrawal
    // treatment later. Only the refund is capped, further down.
    const thirdPillarThisMonth = inputs.thirdPillarMonthly;
    const balanceStartOfYear = secondPillar + thirdPillar + savingsFund;

    for (let month = 0; month < 12; month += 1) {
      secondPillar = secondPillar * (1 + monthlyReturn) + salary * contributionRate;
      thirdPillar = thirdPillar * (1 + monthlyReturn) + thirdPillarThisMonth;
      savingsFund = savingsFund * (1 + savingsMonthlyReturn) + inputs.savingsFundMonthly;
      savingsFundBasis += inputs.savingsFundMonthly;
      memberCapital *= 1 + monthlyReturn;
    }

    // The liikmeboonus is credited once a year on the average annual Tuleva balance
    // (approximated by the mean of the year's start and end), at book value; from then
    // on it rides the market like the pension pot.
    if (isMember) {
      const averageBalance = (balanceStartOfYear + secondPillar + thirdPillar + savingsFund) / 2;
      memberCapital += MEMBERSHIP_BONUS_RATE * averageBalance;
    }

    salary *= 1 + SALARY_GROWTH;
    points.push({
      age: age + 1,
      secondPillar,
      thirdPillar,
      savingsFund,
      memberCapital,
      total: secondPillar + thirdPillar + savingsFund + memberCapital,
    });
  }

  return { points, savingsFundBasis };
}

// Money that already arrived, for drawing the saver's past. `time` is an ISO
// timestamp and `amount` the euros that entered the bucket at that time.
export type PastPayment = { time: string; amount: number };

export interface PastPayments {
  secondPillar: PastPayment[];
  thirdPillar: PastPayment[];
  savingsFund: PastPayment[];
  // Member capital events (bonuses, work compensation, payments), so the band climbs
  // over the member's real history rather than appearing at today.
  memberCapital: PastPayment[];
}

const BUCKETS = ['secondPillar', 'thirdPillar', 'savingsFund', 'memberCapital'] as const;

// The largest believable (balance / net paid in) multiple. When negative correction
// rows nearly cancel a bucket's total, the ratio explodes and every intermediate
// point would show an absurd phantom balance — no Estonian pension bucket has
// tenfolded, so past this the data is noise and the bucket draws no history.
const MAX_HISTORY_SCALE = 10;

/**
 * The saver's past, one point per year from their first contribution to last year
 * (today's point comes from the projection, so the two halves meet without a seam).
 *
 * The register only says what was paid in and what the pot is worth today — the
 * balance at any date in between was never recorded. So each bucket's cumulative
 * contributions are scaled by (today's balance / total paid in), which spreads the
 * investment growth proportionally across the years and lands exactly on today's
 * real balance. That understates early growth and overstates late growth a little,
 * which is fine for an illustration; the endpoints are both facts.
 *
 * A bucket with no balance today draws no history: scaling by zero is the honest
 * answer for money that has since left (e.g. a II pillar someone exited), and
 * fabricating a curve for a balance that exists without contribution data (e.g.
 * transferred-in units) is worse than starting it at today.
 */
export function buildHistory(
  payments: PastPayments,
  balances: Pillars & { memberCapital: number },
  currentAge: number,
  now: Date,
): TimelinePoint[] {
  const buckets = BUCKETS.map((key) => {
    const rows = payments[key]
      .map((payment) => ({ time: new Date(payment.time).getTime(), amount: payment.amount }))
      .filter((payment) => Number.isFinite(payment.time) && payment.time <= now.getTime())
      .sort((a, b) => a.time - b.time);
    const total = rows.reduce((sum, payment) => sum + payment.amount, 0);
    const ratio = total > 0 && balances[key] > 0 ? balances[key] / total : 0;
    const scale = ratio <= MAX_HISTORY_SCALE ? ratio : 0;
    return { key, rows, scale };
  });

  const drawable = buckets.filter((bucket) => bucket.scale > 0 && bucket.rows.length > 0);
  if (!drawable.length) {
    return [];
  }
  const earliest = Math.min(...drawable.map((bucket) => bucket.rows[0].time));

  // The date this many whole years ago; ages between points are approximated from
  // today, since the register gives no birthday.
  const yearsBack = (years: number): number =>
    new Date(now.getFullYear() - years, now.getMonth(), now.getDate()).getTime();

  // Walk back one year at a time until the point PRECEDES the first payment, so the
  // history starts from (near) zero. Never past age zero.
  let span = 0;
  while (span < currentAge && yearsBack(span) > earliest) {
    span += 1;
  }

  const points: TimelinePoint[] = [];
  for (let years = span; years >= 1; years -= 1) {
    const cutoff = yearsBack(years);
    const point: TimelinePoint = {
      age: currentAge - years,
      secondPillar: 0,
      thirdPillar: 0,
      savingsFund: 0,
      memberCapital: 0,
      total: 0,
    };
    buckets.forEach(({ key, rows, scale }) => {
      const cumulative = rows
        .filter((payment) => payment.time <= cutoff)
        .reduce((sum, payment) => sum + payment.amount, 0);
      // Corrections can post negative rows; a stacked area chart cannot dip below zero.
      point[key] = Math.max(0, cumulative * scale);
    });
    point.total = point.secondPillar + point.thirdPillar + point.savingsFund + point.memberCapital;
    points.push(point);
  }
  return points;
}

export function project(inputs: CalculatorInputs): Projection {
  const inflation = (inputs.inflationPercent ?? DEFAULT_INFLATION_PERCENT) / 100;
  const todaysMoney = inputs.todaysMoney ?? true;
  // A saver who is already past the retirement age they picked draws down from
  // today, so anchor the whole withdrawal timeline here rather than in the past.
  const retirementAge = Math.max(inputs.retirementAge, inputs.currentAge);
  const yearsToRetirement = retirementAge - inputs.currentAge;
  const strategy = inputs.payoutStrategy ?? 'fixedPeriod';
  const renewing = strategy !== 'fixedPeriod';
  const months = renewing
    ? Math.max(12, Math.round((SMART_PAYOUT_HORIZON_AGE - retirementAge) * 12))
    : Math.max(1, Math.round(inputs.withdrawalYears * 12));
  const monthlyReturn = monthlyRate(
    netAnnualReturn(inputs.annualReturnPercent, pensionFee(inputs)),
  );
  const savingsMonthlyReturn = monthlyRate(
    netAnnualReturn(inputs.annualReturnPercent, savingsFundFee(inputs)),
  );

  // Deflate to today's money, or leave nominal. Applied at the very end of every
  // figure so the two views differ only in presentation, never in the maths.
  const deflate = (value: number, yearsFromNow: number): number =>
    todaysMoney ? value / (1 + inflation) ** yearsFromNow : value;

  const { points, savingsFundBasis } = accumulate(inputs);
  const atRetirement = points[points.length - 1];

  // A fondipension sells the same number of units every month, so each bucket
  // pays out its balance / months, uprated by the fund's growth since retirement.
  const baseSecond = atRetirement.secondPillar / months;
  const baseThird = atRetirement.thirdPillar / months;
  const baseSavings = atRetirement.savingsFund / months;
  const baseMemberCapital = atRetirement.memberCapital / months;

  const recommendedYears = projectedRemainingYears(retirementAge, yearsToRetirement);
  // Every renewed contract runs at least the tax-free minimum, so renewal
  // strategies are tax free by construction.
  const pensionTaxRate =
    renewing || inputs.withdrawalYears >= recommendedYears ? 0 : SHORT_PERIOD_TAX_RATE;

  // Savings fund money sits outside the pension system. Held in an
  // investeerimiskonto, withdrawals are untaxed until they exceed what was paid
  // in; everything above that basis is taxed as income.
  let cumulativeSavingsWithdrawn = 0;
  // Member capital is drawn like the savings fund, but only the member's own capital
  // contributions are deductible; bonuses, work compensation and growth are all taxed.
  const memberCapitalBasis =
    inputs.memberCapitalBalance !== undefined ? inputs.memberCapitalBasis ?? 0 : 0;
  let cumulativeMemberCapitalWithdrawn = 0;
  let totalNetWithdrawn = 0;
  let totalGrossWithdrawn = 0;
  // Kept apart because they answer different questions: the pension tax is what
  // the payout-period choice costs, the savings-fund and member-capital taxes are
  // owed either way.
  let pensionTax = 0;
  let savingsFundTax = 0;
  let memberCapitalTax = 0;
  let netSum = 0;
  let firstPayment: MonthlyPayment | null = null;
  let lastPayment: MonthlyPayment | null = null;

  const withdrawalPoints: TimelinePoint[] = [];

  // Renewal strategies track the balances explicitly: each contract year sells a
  // fixed fraction of whatever the bucket is worth, so nothing is closed-form.
  let secondValue = atRetirement.secondPillar;
  let thirdValue = atRetirement.thirdPillar;
  let savingsValue = atRetirement.savingsFund;
  let memberCapitalValue = atRetirement.memberCapital;
  let sellRate = 0;

  for (let month = 0; month < months; month += 1) {
    const growth = (1 + monthlyReturn) ** month;
    const savingsGrowth = (1 + savingsMonthlyReturn) ** month;
    const yearsFromNow = yearsToRetirement + month / 12;

    let second: number;
    let third: number;
    let savings: number;
    let memberCapital: number;
    if (renewing) {
      if (month % 12 === 0) {
        const age = retirementAge + month / 12;
        sellRate = 1 / (12 * renewalYears(strategy, age, inputs.currentAge));
        withdrawalPoints.push({
          age,
          secondPillar: deflate(secondValue, yearsFromNow),
          thirdPillar: deflate(thirdValue, yearsFromNow),
          savingsFund: deflate(savingsValue, yearsFromNow),
          memberCapital: deflate(memberCapitalValue, yearsFromNow),
          total: deflate(
            secondValue + thirdValue + savingsValue + memberCapitalValue,
            yearsFromNow,
          ),
        });
      }
      secondValue *= 1 + monthlyReturn;
      second = secondValue * sellRate;
      secondValue -= second;
      thirdValue *= 1 + monthlyReturn;
      third = thirdValue * sellRate;
      thirdValue -= third;
      savingsValue *= 1 + savingsMonthlyReturn;
      savings = savingsValue * sellRate;
      savingsValue -= savings;
      // Member capital grows at the pension return (it sits in the II pillar fund).
      memberCapitalValue *= 1 + monthlyReturn;
      memberCapital = memberCapitalValue * sellRate;
      memberCapitalValue -= memberCapital;
    } else {
      second = baseSecond * growth;
      third = baseThird * growth;
      savings = baseSavings * savingsGrowth;
      memberCapital = baseMemberCapital * growth;
    }

    // Basis is used up first, so early savings-fund withdrawals are untaxed.
    const basisLeft = Math.max(0, savingsFundBasis - cumulativeSavingsWithdrawn);
    const taxableSavings = Math.max(0, savings - basisLeft);
    cumulativeSavingsWithdrawn += savings;

    // Member capital the same way, but the basis is only the own contributions.
    const memberCapitalBasisLeft = Math.max(
      0,
      memberCapitalBasis - cumulativeMemberCapitalWithdrawn,
    );
    const taxableMemberCapital = Math.max(0, memberCapital - memberCapitalBasisLeft);
    cumulativeMemberCapitalWithdrawn += memberCapital;

    const gross = second + third + savings + memberCapital;
    const monthPensionTax = (second + third) * pensionTaxRate;
    const monthSavingsTax = taxableSavings * INCOME_TAX_RATE;
    const monthMemberCapitalTax = taxableMemberCapital * INCOME_TAX_RATE;
    const tax = monthPensionTax + monthSavingsTax + monthMemberCapitalTax;
    const net = gross - tax;

    const payment: MonthlyPayment = {
      secondPillar: deflate(second, yearsFromNow),
      thirdPillar: deflate(third, yearsFromNow),
      savingsFund: deflate(savings, yearsFromNow),
      memberCapital: deflate(memberCapital, yearsFromNow),
      gross: deflate(gross, yearsFromNow),
      tax: deflate(tax, yearsFromNow),
      net: deflate(net, yearsFromNow),
    };

    if (month === 0) {
      firstPayment = payment;
    }
    lastPayment = payment;
    netSum += payment.net;
    totalNetWithdrawn += payment.net;
    totalGrossWithdrawn += payment.gross;
    pensionTax += deflate(monthPensionTax, yearsFromNow);
    savingsFundTax += deflate(monthSavingsTax, yearsFromNow);
    memberCapitalTax += deflate(monthMemberCapitalTax, yearsFromNow);

    // One chart point a year: the remaining balance, which under the classic
    // contract runs down linearly in units and so is (months left / months) of
    // the pot, grown to date. (Renewal strategies pushed their point above.)
    if (!renewing && month % 12 === 0) {
      const remaining = (months - month) / months;
      withdrawalPoints.push({
        age: retirementAge + month / 12,
        secondPillar: deflate(atRetirement.secondPillar * remaining * growth, yearsFromNow),
        thirdPillar: deflate(atRetirement.thirdPillar * remaining * growth, yearsFromNow),
        savingsFund: deflate(atRetirement.savingsFund * remaining * savingsGrowth, yearsFromNow),
        // Member capital runs down with the pillars, at the same pension return.
        memberCapital: deflate(atRetirement.memberCapital * remaining * growth, yearsFromNow),
        total: deflate(
          (atRetirement.secondPillar + atRetirement.thirdPillar + atRetirement.memberCapital) *
            remaining *
            growth +
            atRetirement.savingsFund * remaining * savingsGrowth,
          yearsFromNow,
        ),
      });
    }
  }

  // Close the chart on what is actually left: zero for a classic contract that
  // spends the pot, the remaining balance when renewing.
  const yearsAtEnd = yearsToRetirement + months / 12;
  withdrawalPoints.push(
    renewing
      ? {
          age: retirementAge + months / 12,
          secondPillar: deflate(secondValue, yearsAtEnd),
          thirdPillar: deflate(thirdValue, yearsAtEnd),
          savingsFund: deflate(savingsValue, yearsAtEnd),
          memberCapital: deflate(memberCapitalValue, yearsAtEnd),
          total: deflate(secondValue + thirdValue + savingsValue + memberCapitalValue, yearsAtEnd),
        }
      : {
          age: retirementAge + months / 12,
          secondPillar: 0,
          thirdPillar: 0,
          savingsFund: 0,
          memberCapital: 0,
          total: 0,
        },
  );

  const accumulationPoints = points.map((point) => ({
    age: point.age,
    secondPillar: deflate(point.secondPillar, point.age - inputs.currentAge),
    thirdPillar: deflate(point.thirdPillar, point.age - inputs.currentAge),
    savingsFund: deflate(point.savingsFund, point.age - inputs.currentAge),
    memberCapital: deflate(point.memberCapital, point.age - inputs.currentAge),
    total: deflate(point.total, point.age - inputs.currentAge),
  }));

  const eligibleThirdPillar = Math.min(
    inputs.thirdPillarMonthly * 12,
    thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly) * 12,
  );

  return {
    potAtRetirement: {
      secondPillar: deflate(atRetirement.secondPillar, yearsToRetirement),
      thirdPillar: deflate(atRetirement.thirdPillar, yearsToRetirement),
      savingsFund: deflate(atRetirement.savingsFund, yearsToRetirement),
      // Everything drawable, member capital now included since it is drawn down too.
      total: deflate(
        atRetirement.secondPillar +
          atRetirement.thirdPillar +
          atRetirement.savingsFund +
          atRetirement.memberCapital,
        yearsToRetirement,
      ),
      memberCapital: deflate(atRetirement.memberCapital, yearsToRetirement),
    },
    yearsToRetirement,
    withdrawalMonths: months,
    firstPayment: firstPayment as MonthlyPayment,
    lastPayment: lastPayment as MonthlyPayment,
    averageNetPayment: netSum / months,
    totalNetWithdrawn,
    totalGrossWithdrawn,
    totalTax: pensionTax + savingsFundTax + memberCapitalTax,
    pensionTax,
    savingsFundTax,
    memberCapitalTax,
    pensionTaxRate,
    recommendedYears,
    thirdPillarAnnualRefund: eligibleThirdPillar * INCOME_TAX_RATE,
    timeline: [...accumulationPoints, ...withdrawalPoints.slice(1)],
    todaysMoney,
  };
}
