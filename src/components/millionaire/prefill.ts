import {
  Contribution,
  SecondPillarContribution,
  SourceFund,
  ThirdPillarContribution,
  User,
} from '../common/apiModels';
import {
  CalculatorInputs,
  MAX_THIRD_PILLAR_MONTHLY,
  RETIREMENT_AGE_FALLBACK,
  thirdPillarTaxCapMonthly,
} from './calculation';

// The state always adds 4% of gross to the II pillar, regardless of the
// employee's 2/4/6 rate, so the social-tax portion is a rate-independent way to
// recover the gross wage.
const STATE_SOCIAL_TAX_RATE = 0.04;
const DEFAULT_GROSS_SALARY = 2000;
const SALARY_ROUNDING = 1000;
const BALANCE_ROUNDING = 1000;
const THIRD_PILLAR_ROUNDING = 10;
const TRAILING_MONTHS = 12;

// The user's current values, shaped so `{ ...prefill, annualReturnPercent, currentFundFeePercent }`
// is a ready-to-use CalculatorInputs.
export type PrefillValues = Omit<CalculatorInputs, 'annualReturnPercent' | 'currentFundFeePercent'>;

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;
const floorTo = (value: number, step: number): number => Math.floor(value / step) * step;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const isSecondPillar = (c: Contribution): c is SecondPillarContribution => c.pillar === 2;
const isThirdPillar = (c: Contribution): c is ThirdPillarContribution => c.pillar === 3;

const byTimeDescending = (a: Contribution, b: Contribution): number =>
  new Date(b.time).getTime() - new Date(a.time).getTime();

export function deriveGrossSalary(contributions: Contribution[]): number | null {
  const latest = contributions
    .filter(isSecondPillar)
    .filter((c) => c.socialTaxPortion > 0)
    .sort(byTimeDescending)[0];
  if (!latest) {
    return null;
  }
  // Floor (never round up) so the pre-filled salary is never higher than reality.
  return floorTo(latest.socialTaxPortion / STATE_SOCIAL_TAX_RATE, SALARY_ROUNDING);
}

export function deriveThirdPillarMonthly(contributions: Contribution[], now: Date): number {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const trailingTotal = contributions
    .filter(isThirdPillar)
    .filter((c) => new Date(c.time).getTime() >= cutoff.getTime())
    .reduce((sum, c) => sum + c.amount, 0);

  return clamp(
    roundTo(trailingTotal / TRAILING_MONTHS, THIRD_PILLAR_ROUNDING),
    0,
    MAX_THIRD_PILLAR_MONTHLY,
  );
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
  const grossSalaryMonthly = deriveGrossSalary(contributions) ?? DEFAULT_GROSS_SALARY;
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
