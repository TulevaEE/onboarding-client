const MONTHS_IN_YEAR = 12;
const STATE_CONTRIBUTION_PERCENT = 4;
const INCOME_TAX_RATE = 0.22;
const MONTHLY_BASIC_EXEMPTION = 700;
const UNEMPLOYMENT_INSURANCE_RATE = 0.016;
export const PENSION_UNIT_VALUE = 10.477;
const MINIMUM_WAGE_FROM_APRIL_2026 = 946;
const AVERAGE_INSURED_SALARY_2026 = 5092.7 / 0.2 / MONTHS_IN_YEAR;
const SHARE_OF_PENSION_UNIT_MOVED_TO_SECOND_PILLAR = 0.2;
const AVERAGE_YEARS_IN_RETIREMENT_AT_65 = 19;

export type FirstPillarComparison = {
  firstPillarUnitsLost: number;
  firstPillarMonthly: number;
  firstPillarOverRetirement: number;
  socialTaxYearly: number;
  secondPillarYearly: number;
};

const monthlyIncomeTaxSaved = (grossSalary: number, ownContribution: number) => {
  const taxableBeforeContribution =
    grossSalary * (1 - UNEMPLOYMENT_INSURANCE_RATE) - MONTHLY_BASIC_EXEMPTION;
  return Math.min(ownContribution, Math.max(0, taxableBeforeContribution)) * INCOME_TAX_RATE;
};

const pensionUnitsEarnedInAYear = (grossSalary: number) =>
  0.5 * Math.min(1, grossSalary / MINIMUM_WAGE_FROM_APRIL_2026) +
  0.5 * (grossSalary / AVERAGE_INSURED_SALARY_2026);

export const compareFirstPillarWithSecond = (
  grossSalary: number,
  paymentRatePercent: number,
): FirstPillarComparison => {
  const fromSocialTax = (grossSalary * STATE_CONTRIBUTION_PERCENT) / 100;
  const ownContribution = (grossSalary * paymentRatePercent) / 100;
  const firstPillarUnitsLost =
    SHARE_OF_PENSION_UNIT_MOVED_TO_SECOND_PILLAR * pensionUnitsEarnedInAYear(grossSalary);
  const firstPillarMonthly = firstPillarUnitsLost * PENSION_UNIT_VALUE;
  return {
    firstPillarUnitsLost,
    firstPillarMonthly,
    firstPillarOverRetirement:
      AVERAGE_YEARS_IN_RETIREMENT_AT_65 * MONTHS_IN_YEAR * firstPillarMonthly,
    socialTaxYearly: MONTHS_IN_YEAR * fromSocialTax,
    secondPillarYearly:
      MONTHS_IN_YEAR * (fromSocialTax + monthlyIncomeTaxSaved(grossSalary, ownContribution)),
  };
};
