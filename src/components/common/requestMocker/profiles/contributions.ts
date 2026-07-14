import { Contribution, SecondPillarContribution, ThirdPillarContribution } from '../../apiModels';

// Contributions are read relative to today (a trailing average for the III pillar
// prefill, the last few months for standing-order detection), so the fixtures have
// to move with the calendar instead of being pinned to a date.
const monthsAgo = (months: number): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, 5).toISOString();
};

// 4% of gross is the state's social-tax top-up, so 80 € means a 2000 € gross salary.
// On that salary the III pillar tax ceiling is 15%, i.e. 300 € a month.
const salary = (months: number): SecondPillarContribution => ({
  pillar: 2,
  socialTaxPortion: 80,
  employeeWithheldPortion: 40,
  additionalParentalBenefit: 0,
  interest: 0,
  time: monthsAgo(months),
  amount: 120,
  sender: 'Employer',
  currency: 'EUR',
});

const thirdPillar = (amount: number, months: number): ThirdPillarContribution => ({
  pillar: 3,
  amount,
  time: monthsAgo(months),
  sender: 'Self',
  currency: 'EUR',
});

const salaryEveryMonth = [salary(0), salary(1), salary(2), salary(3)];

const everyMonth = (amount: number): ThirdPillarContribution[] => [
  thirdPillar(amount, 0),
  thirdPillar(amount, 1),
  thirdPillar(amount, 2),
];

export const contributionsProfiles: Record<string, Contribution[]> = {
  NONE: [],
  SECOND_PILLAR_ONLY: salaryEveryMonth,
  // One lump sum: contributing, but no standing order to recognise.
  THIRD_PILLAR_ONE_OFF: [...salaryEveryMonth, thirdPillar(1200, 1)],
  // A standing order paying less than the 300 €/month tax ceiling.
  THIRD_PILLAR_MONTHLY_BELOW_CAP: [...salaryEveryMonth, ...everyMonth(200)],
  // A standing order paying the whole tax ceiling.
  THIRD_PILLAR_MONTHLY_MAXED: [...salaryEveryMonth, ...everyMonth(300)],
};
