// Pure projection maths for the "II + III pillar millionaire" calculator.
//
// Ported from the campaign prototype
// (tuleva/work/karoliina/Juuli kampaania 2026/miljonariks-landing.html). The
// numbers are verified against that prototype, verbatim, in calculation.test.ts.
// Two deliberate generalisations over the prototype: the retirement age is a
// per-user input (the prototype hardcoded 67), and the III pillar contribution
// can be a flat monthly euro amount (the saver's actual standing order) as well
// as a percent of salary (Laura's optimum).

export const RETIREMENT_AGE_FALLBACK = 67;
// Tuleva's own fee, used only when the live fund list is unavailable: the real figure
// is read off /v1/funds so it stays right when Tuleva changes what it charges.
export const TULEVA_FEE = 0.0028;
export const HIGH_FEE = 0.015;
export const THIRD_PILLAR_ANNUAL_TAX_CAP = 6000;
export const MAX_THIRD_PILLAR_MONTHLY = THIRD_PILLAR_ANNUAL_TAX_CAP / 12; // 500

export const LAURA_SECOND_PILLAR_RATE = 6;
// The III pillar tax deduction is capped at the lower of 15% of gross income or
// EUR 6000/year — contributing above that earns no tax back.
export const THIRD_PILLAR_TAX_DEDUCTIBLE_RATE = 0.15;

// The most a saver can put into the III pillar with a tax benefit, per month:
// min(15% of gross, EUR 500). This is the ceiling of the contribution slider AND
// the level Laura's recipe contributes — so maxing the slider matches Laura.
export function thirdPillarTaxCapMonthly(grossSalaryMonthly: number): number {
  return Math.min(THIRD_PILLAR_TAX_DEDUCTIBLE_RATE * grossSalaryMonthly, MAX_THIRD_PILLAR_MONTHLY);
}

const SALARY_GROWTH = 0.03;
const STATE_SECOND_PILLAR_TOP_UP = 4; // the state adds 4% of gross on top of the employee rate
const MILLION = 1e6;
const MAX_PROJECTION_AGE = 101;

export type ThirdPillarContribution =
  | { mode: 'percentOfSalary'; percent: number }
  | { mode: 'fixedAnnual'; annual: number };

export interface ProjectionInput {
  currentAge: number;
  retirementAge: number;
  grossSalaryMonthly: number;
  initialBalance: number;
  // The III-pillar share of initialBalance, so the per-pillar breakdown attributes
  // existing III savings to III rather than II. Defaults to 0 (all in II).
  initialThirdPillarBalance?: number;
  secondPillarRate: number;
  thirdPillar: ThirdPillarContribution;
  annualReturnPercent: number;
  fee?: number;
  // Money outside the pillars, in the Tuleva savings fund. It is already a low-fee
  // Tuleva index fund, so it grows at the savings fund's own fee: `fee` above is the fee
  // on the saver's *pension* funds and must not drag this down with it.
  initialSavingsFundBalance?: number;
  savingsFundMonthly?: number;
  savingsFundFee?: number;
}

export interface ProjectionResult {
  total: number;
  secondPillar: number;
  thirdPillar: number;
  savingsFund: number;
  millionaireAge: number | null;
}

export interface TrajectoryPoint {
  age: number;
  value: number;
}

interface YearlyBalance {
  age: number;
  secondPillar: number;
  thirdPillar: number;
  savingsFund: number;
}

interface Simulation {
  points: YearlyBalance[];
  netAnnualReturn: number;
  savingsFundNetReturn: number;
}

const totalOf = (balance: YearlyBalance): number =>
  balance.secondPillar + balance.thirdPillar + balance.savingsFund;

const monthlyRate = (netAnnualReturn: number): number =>
  (1 + Math.max(netAnnualReturn, -0.99)) ** (1 / 12) - 1;

function simulate(input: ProjectionInput): Simulation {
  const fee = input.fee ?? TULEVA_FEE;
  const netAnnualReturn = input.annualReturnPercent / 100 - fee;
  const monthlyReturn = monthlyRate(netAnnualReturn);
  // The savings fund is already a Tuleva index fund, so it earns its own low fee
  // whatever the saver's pension funds charge.
  const savingsFundNetReturn =
    input.annualReturnPercent / 100 - (input.savingsFundFee ?? TULEVA_FEE);
  const savingsFundMonthlyReturn = monthlyRate(savingsFundNetReturn);
  // Rate 0 means the saver isn't in the funded II pillar, so there is no
  // contribution and no state top-up. Otherwise the state adds its 4% of gross.
  const secondPillarContributionRate =
    input.secondPillarRate > 0 ? (input.secondPillarRate + STATE_SECOND_PILLAR_TOP_UP) / 100 : 0;

  const initialThirdPillar = input.initialThirdPillarBalance ?? 0;
  const monthlySavingsFund = input.savingsFundMonthly ?? 0;
  let salary = input.grossSalaryMonthly;
  let secondPillar = Math.max(0, input.initialBalance - initialThirdPillar);
  let thirdPillar = initialThirdPillar;
  let savingsFund = input.initialSavingsFundBalance ?? 0;

  const points: YearlyBalance[] = [
    { age: input.currentAge, secondPillar, thirdPillar, savingsFund },
  ];

  for (let age = input.currentAge; age < input.retirementAge; age += 1) {
    const desiredAnnualThirdPillar =
      input.thirdPillar.mode === 'percentOfSalary'
        ? (input.thirdPillar.percent / 100) * salary * 12
        : input.thirdPillar.annual;
    const monthlyThirdPillar = Math.min(desiredAnnualThirdPillar, THIRD_PILLAR_ANNUAL_TAX_CAP) / 12;

    for (let month = 0; month < 12; month += 1) {
      secondPillar = secondPillar * (1 + monthlyReturn) + salary * secondPillarContributionRate;
      thirdPillar = thirdPillar * (1 + monthlyReturn) + monthlyThirdPillar;
      savingsFund = savingsFund * (1 + savingsFundMonthlyReturn) + monthlySavingsFund;
    }
    salary *= 1 + SALARY_GROWTH;
    points.push({ age: age + 1, secondPillar, thirdPillar, savingsFund });
  }

  return { points, netAnnualReturn, savingsFundNetReturn };
}

function millionaireAgeFrom(simulation: Simulation, retirementAge: number): number | null {
  const reached = simulation.points.find((point) => totalOf(point) >= MILLION);
  if (reached) {
    return reached.age;
  }
  const { netAnnualReturn, savingsFundNetReturn } = simulation;
  if (netAnnualReturn <= 0 && savingsFundNetReturn <= 0) {
    return null;
  }
  // Past retirement the contributions stop but the money keeps compounding, each bucket
  // at its own rate: an expensive pension fund can eat its whole return while the
  // savings fund, on Tuleva's fee, still grows.
  const last = simulation.points[simulation.points.length - 1];
  let pension = last.secondPillar + last.thirdPillar;
  let { savingsFund } = last;
  let age = retirementAge;
  while (pension + savingsFund < MILLION && age < MAX_PROJECTION_AGE) {
    pension *= 1 + netAnnualReturn;
    savingsFund *= 1 + savingsFundNetReturn;
    age += 1;
  }
  return pension + savingsFund >= MILLION ? age : null;
}

export function project(input: ProjectionInput): ProjectionResult {
  const simulation = simulate(input);
  const last = simulation.points[simulation.points.length - 1];
  return {
    total: totalOf(last),
    secondPillar: last.secondPillar,
    thirdPillar: last.thirdPillar,
    savingsFund: last.savingsFund,
    millionaireAge: millionaireAgeFrom(simulation, input.retirementAge),
  };
}

export function trajectory(input: ProjectionInput): TrajectoryPoint[] {
  return simulate(input).points.map((point) => ({ age: point.age, value: totalOf(point) }));
}

export interface CalculatorInputs {
  currentAge: number;
  retirementAge: number;
  grossSalaryMonthly: number;
  initialBalance: number;
  initialThirdPillarBalance: number;
  currentSecondPillarRate: number;
  currentThirdPillarMonthly: number;
  annualReturnPercent: number;
  // Annual fee (%) on the saver's current fund. Drags the current-course line only;
  // Tuleva's recipe is a low-fee index fund, so its line is unaffected.
  currentFundFeePercent: number;
  // Savings fund money, which is outside the pillars and identical under either course:
  // it adds to both lines and so leaves the gap between them untouched.
  initialSavingsFundBalance: number;
  savingsFundMonthly: number;
  // Tuleva's own fees, as the live fund list reports them. The recipe's fee applies to
  // the pillars on Tuleva's line; the savings fund's applies to savings fund money on
  // both lines, because that money is at Tuleva whichever course the saver takes.
  tulevaFee: number;
  savingsFundFee: number;
}

export interface Comparison {
  today: ProjectionResult;
  laura: ProjectionResult;
  lauraHighFee: ProjectionResult;
  gap: number;
  feeCost: number;
  todayTrajectory: TrajectoryPoint[];
  lauraTrajectory: TrajectoryPoint[];
}

export function buildComparison(inputs: CalculatorInputs): Comparison {
  const shared = {
    currentAge: inputs.currentAge,
    retirementAge: inputs.retirementAge,
    grossSalaryMonthly: inputs.grossSalaryMonthly,
    initialBalance: inputs.initialBalance,
    initialThirdPillarBalance: inputs.initialThirdPillarBalance,
    annualReturnPercent: inputs.annualReturnPercent,
    initialSavingsFundBalance: inputs.initialSavingsFundBalance,
    savingsFundMonthly: inputs.savingsFundMonthly,
    savingsFundFee: inputs.savingsFundFee,
  };

  // The current-course line carries the saver's own fund fee (the slider, pre-filled
  // from their weighted-average fee); Tuleva's recipe carries Tuleva's low index-fund
  // fee. The gap between the two lines is contributions AND the fee difference.
  const todayInput: ProjectionInput = {
    ...shared,
    secondPillarRate: inputs.currentSecondPillarRate,
    thirdPillar: { mode: 'fixedAnnual', annual: inputs.currentThirdPillarMonthly * 12 },
    fee: inputs.currentFundFeePercent / 100,
  };
  const lauraInput: ProjectionInput = {
    ...shared,
    secondPillarRate: LAURA_SECOND_PILLAR_RATE,
    // Laura maxes the tax-advantaged III pillar. Modelled as a flat monthly amount
    // (like the saver's own standing order) so that a saver who maxes both pillars
    // matches Laura exactly instead of drifting above or below a percent-of-salary line.
    thirdPillar: {
      mode: 'fixedAnnual',
      annual: thirdPillarTaxCapMonthly(inputs.grossSalaryMonthly) * 12,
    },
    fee: inputs.tulevaFee,
  };
  const lauraHighFeeInput: ProjectionInput = { ...lauraInput, fee: HIGH_FEE };

  const today = project(todayInput);
  const laura = project(lauraInput);
  const lauraHighFee = project(lauraHighFeeInput);

  return {
    today,
    laura,
    lauraHighFee,
    gap: laura.total - today.total,
    feeCost: laura.total - lauraHighFee.total,
    todayTrajectory: trajectory(todayInput),
    lauraTrajectory: trajectory(lauraInput),
  };
}
