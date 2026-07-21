import {
  Contribution,
  Fund,
  SecondPillarContribution,
  SourceFund,
  ThirdPillarContribution,
  Transaction,
  User,
} from '../common/apiModels';
import {
  CalculatorInputs,
  MAX_THIRD_PILLAR_MONTHLY,
  RETIREMENT_AGE_FALLBACK,
  thirdPillarTaxCapMonthly,
  TULEVA_FEE,
} from './calculation';

// The state always adds 4% of gross to the II pillar, regardless of the
// employee's 2/4/6 rate, so the social-tax portion is a rate-independent way to
// recover the gross wage.
const STATE_SOCIAL_TAX_RATE = 0.04;
const DEFAULT_GROSS_SALARY = 2000;
const SALARY_ROUNDING = 1000;
const BALANCE_ROUNDING = 1000;
// Both monthly sliders step in 10 €, so pre-filled amounts land on a step.
const MONTHLY_ROUNDING = 10;
const TRAILING_MONTHS = 12;
// A standing order is set up in the saver's own bank, so we can only recognise it
// by its fingerprint: money arriving nearly every month. Look at the last four
// calendar months and allow one gap, since the current month's payment may not
// have landed yet and the register lags. Deliberately blind to the amount: a saver
// who raised their standing order, or whose employer pays a percentage of salary,
// is still paying monthly.
const RECURRING_LOOKBACK_MONTHS = 4;
const RECURRING_MIN_MONTHS = 3;

// The user's current values, as far as the user, their funds and their contributions
// know them. The return, the fund fee and the savings fund come from elsewhere, so the
// component fills those in on top.
export type PrefillValues = Omit<
  CalculatorInputs,
  | 'annualReturnPercent'
  | 'currentFundFeePercent'
  | 'initialSavingsFundBalance'
  | 'savingsFundMonthly'
  | 'tulevaFee'
  | 'savingsFundFee'
>;

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;
const floorTo = (value: number, step: number): number => Math.floor(value / step) * step;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const isSecondPillar = (c: Contribution): c is SecondPillarContribution => c.pillar === 2;
const isThirdPillar = (c: Contribution): c is ThirdPillarContribution => c.pillar === 3;

export function deriveGrossSalary(contributions: Contribution[], now: Date): number | null {
  const secondPillar = contributions.filter(isSecondPillar).filter((c) => c.socialTaxPortion > 0);
  if (!secondPillar.length) {
    return null;
  }
  // The state adds 4% of gross as social tax, so a full working month's portion recovers
  // the gross. A single month, though, can be a partial posting, a correction, or a dip
  // like parental leave, and taking the latest one alone floors the salary to nonsense
  // (even 0). So sum the portion per calendar month and take the MEDIAN recent month:
  // that discards outliers at both ends — a leave dip and a one-off bonus alike — and
  // for a genuinely fluctuating salary settles on the typical month.
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const monthlyPortions = (rows: SecondPillarContribution[]): number[] => {
    const byMonth = new Map<string, number>();
    rows.forEach((c) => {
      const key = `${new Date(c.time).getFullYear()}-${new Date(c.time).getMonth()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + c.socialTaxPortion);
    });
    return Array.from(byMonth.values());
  };
  const recent = secondPillar.filter((c) => new Date(c.time).getTime() >= cutoff.getTime());
  // Prefer the last year; if they stopped contributing over a year ago, fall back to all
  // of it rather than losing the salary entirely.
  const portions = monthlyPortions(recent.length ? recent : secondPillar).sort((a, b) => a - b);
  const mid = Math.floor(portions.length / 2);
  const medianPortion =
    portions.length % 2 ? portions[mid] : (portions[mid - 1] + portions[mid]) / 2;
  // Floor (never round up) so the pre-filled salary is never higher than reality.
  const gross = floorTo(medianPortion / STATE_SOCIAL_TAX_RATE, SALARY_ROUNDING);
  return gross > 0 ? gross : null;
}

export function deriveThirdPillarMonthly(contributions: Contribution[], now: Date): number {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const trailingTotal = contributions
    .filter(isThirdPillar)
    .filter((c) => new Date(c.time).getTime() >= cutoff.getTime())
    .reduce((sum, c) => sum + c.amount, 0);

  return clamp(
    roundTo(trailingTotal / TRAILING_MONTHS, MONTHLY_ROUNDING),
    0,
    MAX_THIRD_PILLAR_MONTHLY,
  );
}

// Money arriving, whatever it was paid into.
export type Payment = { time: string; amount: number };

// Recent money, totalled per calendar month and keyed by how many months back that
// month is (0 = this month), so a month with two payments counts once.
const recentPaymentsByMonth = (payments: Payment[], now: Date): Map<number, number> => {
  const totals = new Map<number, number>();
  payments
    .filter((payment) => payment.amount > 0)
    .forEach((payment) => {
      const time = new Date(payment.time);
      const monthsAgo =
        (now.getFullYear() - time.getFullYear()) * 12 + (now.getMonth() - time.getMonth());
      if (monthsAgo >= 0 && monthsAgo < RECURRING_LOOKBACK_MONTHS) {
        totals.set(monthsAgo, (totals.get(monthsAgo) ?? 0) + payment.amount);
      }
    });
  return totals;
};

const paysMonthly = (totals: Map<number, number>): boolean => totals.size >= RECURRING_MIN_MONTHS;

// What the standing order pays today: the newest month's total, not a trailing
// average, so someone who raised their standing order sees the amount they set.
const latestMonthTotal = (totals: Map<number, number>): number =>
  totals.size === 0 ? 0 : totals.get(Math.min(...Array.from(totals.keys()))) ?? 0;

export function contributesMonthlyToThirdPillar(contributions: Contribution[], now: Date): boolean {
  return paysMonthly(recentPaymentsByMonth(contributions.filter(isThirdPillar), now));
}

export function latestThirdPillarMonthlyAmount(contributions: Contribution[], now: Date): number {
  return latestMonthTotal(recentPaymentsByMonth(contributions.filter(isThirdPillar), now));
}

// The savings fund is the one fund outside the pillars, so its money is exactly the
// transactions against a fund with no pillar.
const savingsFundTransactions = (funds: Fund[], transactions: Transaction[]): Transaction[] => {
  const savingsFundIsins = new Set(
    funds.filter((fund) => fund.pillar === null).map((fund) => fund.isin),
  );
  return transactions.filter((transaction) => savingsFundIsins.has(transaction.isin));
};

// Only the inflows: for recognising a saving habit, a withdrawal says nothing.
export function selectSavingsFundPayments(funds: Fund[], transactions: Transaction[]): Payment[] {
  return savingsFundTransactions(funds, transactions)
    .filter((transaction) => transaction.type !== 'SUBTRACTION')
    .map((transaction) => ({ time: transaction.time, amount: transaction.amount }));
}

// Every movement, withdrawals included (their amounts come negative): for drawing the
// past, a redemption must show as a dip, not vanish.
export function selectSavingsFundFlows(funds: Fund[], transactions: Transaction[]): Payment[] {
  return savingsFundTransactions(funds, transactions).map((transaction) => ({
    time: transaction.time,
    amount: transaction.amount,
  }));
}

// Tuleva's own fees, read from the live fund list rather than hardcoded, so calculators
// stay honest if Tuleva ever changes what it charges. Today every Tuleva fund is at the
// same 0.28%; if they ever diverge, the recipe means the cheapest index fund.
export function deriveTulevaFees(funds: Fund[]): { pension: number; savingsFund: number } {
  const tulevaFunds = funds.filter(
    (fund) =>
      fund.status === 'ACTIVE' &&
      fund.fundManager.name === 'Tuleva' &&
      fund.ongoingChargesFigure > 0,
  );
  const cheapestOf = (candidates: Fund[]): number =>
    candidates.length
      ? Math.min(...candidates.map((fund) => fund.ongoingChargesFigure))
      : TULEVA_FEE;
  return {
    // The pillars, for the pension lines; and the savings fund, which is outside them.
    pension: cheapestOf(tulevaFunds.filter((fund) => fund.pillar !== null)),
    savingsFund: cheapestOf(tulevaFunds.filter((fund) => fund.pillar === null)),
  };
}

// Fallbacks used until /v1/funds loads; the live min/max come from that list, so we
// never hand-maintain the cheapest/priciest Estonian pension fund fees.
const FEE_MIN_FALLBACK = 0.27;
const FEE_MAX_FALLBACK = 1.57;

// Fee-slider bounds straight from the live pension-fund list (cheapest to priciest),
// so the range stays correct without manual upkeep. Fees come as fractions and go
// out as clean 2-decimal percents: 0.0157 * 100 is 1.5699999999999998 in binary
// floating point, so scale-then-round instead of a bare * 100. The savings fund
// (pillar null) is excluded — the slider models the pension pillars' fee.
export function deriveFeeBounds(funds: Fund[]): { min: number; max: number } {
  const fees = funds
    .filter(
      (fund) => fund.status === 'ACTIVE' && fund.pillar !== null && fund.ongoingChargesFigure > 0,
    )
    .map((fund) => Math.round(fund.ongoingChargesFigure * 10000) / 100);
  return fees.length
    ? { min: Math.min(...fees), max: Math.max(...fees) }
    : { min: FEE_MIN_FALLBACK, max: FEE_MAX_FALLBACK };
}

// Savings fund money is lumpy: a one-off transfer is usually existing wealth moving in,
// not a new habit, and averaging it over twelve months would invent a monthly
// contribution the saver never makes (and then project it for decades). So only a real
// standing order pre-fills the slider; anything else starts the saver at zero.
export function deriveSavingsFundMonthly(payments: Payment[], now: Date): number {
  const totals = recentPaymentsByMonth(payments, now);
  return paysMonthly(totals) ? roundTo(latestMonthTotal(totals), MONTHLY_ROUNDING) : 0;
}

export function deriveInitialBalance(sourceFunds: SourceFund[]): number {
  const total = sourceFunds
    .filter((fund) => fund.pillar === 2 || fund.pillar === 3)
    .reduce((sum, fund) => sum + fund.price + fund.unavailablePrice, 0);
  return roundTo(total, BALANCE_ROUNDING);
}

export function deriveThirdPillarBalance(sourceFunds: SourceFund[]): number {
  const total = sourceFunds
    .filter((fund) => fund.pillar === 3)
    .reduce((sum, fund) => sum + fund.price + fund.unavailablePrice, 0);
  return roundTo(total, BALANCE_ROUNDING);
}

export function derivePrefill(
  user: User,
  sourceFunds: SourceFund[],
  contributions: Contribution[],
  now: Date,
): PrefillValues {
  const grossSalaryMonthly = deriveGrossSalary(contributions, now) ?? DEFAULT_GROSS_SALARY;
  return {
    currentAge: user.age,
    retirementAge: user.retirementAge || RETIREMENT_AGE_FALLBACK,
    grossSalaryMonthly,
    initialBalance: deriveInitialBalance(sourceFunds),
    initialThirdPillarBalance: deriveThirdPillarBalance(sourceFunds),
    // 0 = no II contribution (the saver has left the funded II pillar).
    currentSecondPillarRate: user.secondPillarActive
      ? user.secondPillarPaymentRates?.current ?? 2
      : 0,
    // Cap at the tax-advantaged ceiling — the slider never exceeds it either.
    currentThirdPillarMonthly: Math.min(
      deriveThirdPillarMonthly(contributions, now),
      thirdPillarTaxCapMonthly(grossSalaryMonthly),
    ),
  };
}
