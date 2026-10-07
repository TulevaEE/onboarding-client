import { PaymentRate } from '../secondPillarPaymentRate/types';

export const STATE_CONTRIBUTION_PERCENT = 4;
const INCOME_TAX_RATE = 0.22;
const MONTHLY_BASIC_EXEMPTION = 700;
const UNEMPLOYMENT_INSURANCE_RATE = 0.016;
const MONTHS_IN_TEN_YEARS = 120;

export type RejoinContributions = {
  statePerMonth: number;
  netSalaryCostPerMonth: number;
  incomeTaxSavedPerMonth: number;
  intoPillarPerMonth: number;
  tenYearTotal: number;
  tenYearStateShare: number;
};

const incomeTaxSaved = (grossMonthlySalary: number, ownContribution: number) => {
  const taxableBeforeContribution =
    grossMonthlySalary * (1 - UNEMPLOYMENT_INSURANCE_RATE) - MONTHLY_BASIC_EXEMPTION;
  return Math.min(ownContribution, Math.max(0, taxableBeforeContribution)) * INCOME_TAX_RATE;
};

export const rejoinContributions = (
  grossMonthlySalary: number,
  paymentRate: PaymentRate,
): RejoinContributions => {
  const ownContribution = (grossMonthlySalary * paymentRate) / 100;
  const stateContribution = (grossMonthlySalary * STATE_CONTRIBUTION_PERCENT) / 100;
  const intoPillarPerMonth = ownContribution + stateContribution;

  const incomeTaxSavedPerMonth = incomeTaxSaved(grossMonthlySalary, ownContribution);

  return {
    statePerMonth: stateContribution,
    netSalaryCostPerMonth: ownContribution - incomeTaxSavedPerMonth,
    incomeTaxSavedPerMonth,
    intoPillarPerMonth,
    tenYearTotal: intoPillarPerMonth * MONTHS_IN_TEN_YEARS,
    tenYearStateShare: stateContribution * MONTHS_IN_TEN_YEARS,
  };
};
