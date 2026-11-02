import { Contribution, SecondPillarContribution } from './apiModels';

// The state always adds 4% of gross to the II pillar, regardless of the
// employee's 2/4/6 rate, so the social-tax portion is a rate-independent way to
// recover the gross wage.
const STATE_SOCIAL_TAX_RATE = 0.04;
const SALARY_ROUNDING = 1000;

const floorTo = (value: number, step: number): number => Math.floor(value / step) * step;

const isSecondPillar = (c: Contribution): c is SecondPillarContribution => c.pillar === 2;

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
