import {
  contributesMonthlyToThirdPillar,
  deriveGrossSalary,
  deriveInitialBalance,
  derivePrefill,
  deriveSavingsFundMonthly,
  deriveThirdPillarBalance,
  deriveThirdPillarMonthly,
  deriveTulevaFees,
  latestThirdPillarMonthlyAmount,
  selectSavingsFundFlows,
  selectSavingsFundPayments,
} from './prefill';
import {
  Contribution,
  Fund,
  SecondPillarContribution,
  SourceFund,
  ThirdPillarContribution,
  Transaction,
  User,
} from '../common/apiModels';
import { MAX_THIRD_PILLAR_MONTHLY, TULEVA_FEE } from './calculation';

const secondPillarContribution = (
  socialTaxPortion: number,
  time: string,
  employeeWithheldPortion = socialTaxPortion / 2,
): SecondPillarContribution => ({
  pillar: 2,
  socialTaxPortion,
  employeeWithheldPortion,
  additionalParentalBenefit: 0,
  interest: 0,
  time,
  amount: socialTaxPortion + employeeWithheldPortion,
  sender: 'Employer',
  currency: 'EUR',
});

const thirdPillarContribution = (amount: number, time: string): ThirdPillarContribution => ({
  pillar: 3,
  amount,
  time,
  sender: 'Self',
  currency: 'EUR',
});

const sourceFund = (pillar: 2 | 3, price: number, unavailablePrice = 0): SourceFund =>
  ({ pillar, price, unavailablePrice } as SourceFund);

describe('deriveGrossSalary', () => {
  const now = new Date('2026-07-01T00:00:00Z');

  it('derives gross from the state 4% social-tax portion, rate-independently, floored to 1000', () => {
    // 96 social tax => gross 2400 => floors to 2000. Rate of the row is irrelevant.
    expect(deriveGrossSalary([secondPillarContribution(96, '2026-05-10T00:00:00Z')], now)).toBe(
      2000,
    );
  });

  it('ignores a low recent month like parental leave and keeps the typical salary', () => {
    // Eleven full months at 120 (gross 3000) and one recent leave month near zero. The
    // median month is still a full one, so the dip does not drag the salary down.
    const months = Array.from({ length: 11 }, (_, i) =>
      secondPillarContribution(120, `2025-${String(i + 1).padStart(2, '0')}-10T00:00:00Z`),
    );
    const salary = deriveGrossSalary(
      [...months, secondPillarContribution(3, '2026-06-10T00:00:00Z')],
      now,
    );
    expect(salary).toBe(3000);
  });

  it('ignores a one-off bonus month, taking the typical month instead', () => {
    const months = Array.from({ length: 11 }, (_, i) =>
      secondPillarContribution(120, `2025-${String(i + 1).padStart(2, '0')}-10T00:00:00Z`),
    );
    const salary = deriveGrossSalary(
      [...months, secondPillarContribution(400, '2026-06-10T00:00:00Z')], // bonus, gross 10000
      now,
    );
    expect(salary).toBe(3000);
  });

  it('sums several postings within the same calendar month before comparing months', () => {
    // Two rows in one month (employer split, correction) make up that month's true 4%.
    const salary = deriveGrossSalary(
      [
        secondPillarContribution(60, '2026-05-10T00:00:00Z'),
        secondPillarContribution(60, '2026-05-25T00:00:00Z'), // same month, together gross 3000
      ],
      now,
    );
    expect(salary).toBe(3000);
  });

  it('ignores third-pillar rows and months without a social-tax base', () => {
    const salary = deriveGrossSalary(
      [
        thirdPillarContribution(500, '2026-06-20T00:00:00Z') as Contribution,
        secondPillarContribution(0, '2026-06-15T00:00:00Z'), // state-only gap month, skip
        secondPillarContribution(100, '2026-03-10T00:00:00Z'), // gross 2500 -> 2000 floored
      ],
      now,
    );
    expect(salary).toBe(2000);
  });

  it('falls back to all-time contributions when nothing landed in the last year', () => {
    // Stopped contributing over a year ago: still recover a salary rather than lose it.
    expect(deriveGrossSalary([secondPillarContribution(120, '2023-04-10T00:00:00Z')], now)).toBe(
      3000,
    );
  });

  it('returns null when there is no usable second-pillar contribution', () => {
    expect(deriveGrossSalary([], now)).toBeNull();
    expect(
      deriveGrossSalary(
        [thirdPillarContribution(100, '2026-06-20T00:00:00Z') as Contribution],
        now,
      ),
    ).toBeNull();
  });
});

describe('deriveThirdPillarMonthly', () => {
  const now = new Date('2026-07-01T00:00:00Z');

  it('averages the trailing twelve months of third-pillar contributions', () => {
    const monthly = deriveThirdPillarMonthly(
      [
        thirdPillarContribution(1200, '2026-01-15T00:00:00Z'),
        thirdPillarContribution(1200, '2026-04-15T00:00:00Z'),
      ],
      now,
    );
    expect(monthly).toBe(200); // 2400 / 12
  });

  it('excludes contributions older than twelve months', () => {
    const monthly = deriveThirdPillarMonthly(
      [
        thirdPillarContribution(6000, '2025-01-01T00:00:00Z'), // > 12 months ago, excluded
        thirdPillarContribution(1200, '2026-06-15T00:00:00Z'),
      ],
      now,
    );
    expect(monthly).toBe(100); // only 1200 / 12
  });

  it('rounds to the nearest 10 and caps at the tax-deductible monthly ceiling', () => {
    const capped = deriveThirdPillarMonthly(
      [thirdPillarContribution(12000, '2026-06-15T00:00:00Z')],
      now,
    );
    expect(capped).toBe(MAX_THIRD_PILLAR_MONTHLY);
  });

  it('returns 0 when there are no third-pillar contributions', () => {
    expect(deriveThirdPillarMonthly([], now)).toBe(0);
    expect(
      deriveThirdPillarMonthly([secondPillarContribution(100, '2026-06-10T00:00:00Z')], now),
    ).toBe(0);
  });
});

describe('contributesMonthlyToThirdPillar', () => {
  const now = new Date('2026-07-15T00:00:00Z');

  it('recognises a standing order paying every month', () => {
    expect(
      contributesMonthlyToThirdPillar(
        [
          thirdPillarContribution(200, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-06-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-05-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-04-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(true);
  });

  it('allows one gap, so the current month need not have landed yet', () => {
    expect(
      contributesMonthlyToThirdPillar(
        [
          thirdPillarContribution(200, '2026-06-25T00:00:00Z'),
          thirdPillarContribution(200, '2026-05-25T00:00:00Z'),
          thirdPillarContribution(200, '2026-04-25T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(true);
  });

  it('ignores the amount, so raising a standing order still counts as monthly', () => {
    expect(
      contributesMonthlyToThirdPillar(
        [
          thirdPillarContribution(500, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(500, '2026-06-05T00:00:00Z'),
          thirdPillarContribution(100, '2026-05-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(true);
  });

  it('does not count several payments made within the same month', () => {
    expect(
      contributesMonthlyToThirdPillar(
        [
          thirdPillarContribution(200, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-07-15T00:00:00Z'),
          thirdPillarContribution(200, '2026-06-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(false);
  });

  it('does not count months outside the four-month window', () => {
    expect(
      contributesMonthlyToThirdPillar(
        [
          thirdPillarContribution(200, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-03-05T00:00:00Z'),
          thirdPillarContribution(200, '2026-02-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(false);
  });

  it('is false for a one-off payer and for someone with no III pillar at all', () => {
    expect(
      contributesMonthlyToThirdPillar([thirdPillarContribution(6000, '2026-06-05T00:00:00Z')], now),
    ).toBe(false);
    expect(contributesMonthlyToThirdPillar([], now)).toBe(false);
    expect(
      contributesMonthlyToThirdPillar(
        [
          secondPillarContribution(80, '2026-07-05T00:00:00Z'),
          secondPillarContribution(80, '2026-06-05T00:00:00Z'),
          secondPillarContribution(80, '2026-05-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(false);
  });
});

describe('latestThirdPillarMonthlyAmount', () => {
  const now = new Date('2026-07-15T00:00:00Z');

  it('returns the newest month total, so a raised standing order shows its new amount', () => {
    expect(
      latestThirdPillarMonthlyAmount(
        [
          thirdPillarContribution(300, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(100, '2026-06-05T00:00:00Z'),
          thirdPillarContribution(100, '2026-05-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(300);
  });

  it('sums several payments landing in the same month', () => {
    expect(
      latestThirdPillarMonthlyAmount(
        [
          thirdPillarContribution(200, '2026-07-05T00:00:00Z'),
          thirdPillarContribution(50, '2026-07-20T00:00:00Z'),
          thirdPillarContribution(200, '2026-06-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(250);
  });

  it('returns 0 when nothing has arrived within the window', () => {
    expect(latestThirdPillarMonthlyAmount([], now)).toBe(0);
    expect(
      latestThirdPillarMonthlyAmount([thirdPillarContribution(200, '2026-01-05T00:00:00Z')], now),
    ).toBe(0);
  });
});

describe('deriveSavingsFundMonthly', () => {
  const now = new Date('2026-07-15T00:00:00Z');
  const payment = (amount: number, time: string) => ({ amount, time });

  it('pre-fills from a standing order, using the newest month', () => {
    expect(
      deriveSavingsFundMonthly(
        [
          payment(300, '2026-07-05T00:00:00Z'),
          payment(200, '2026-06-05T00:00:00Z'),
          payment(200, '2026-05-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(300);
  });

  it('stays at zero for a lump sum, rather than inventing a monthly habit from it', () => {
    // 20 000 € moved in once is existing wealth arriving, not 1667 € a month forever.
    expect(deriveSavingsFundMonthly([payment(20000, '2026-06-15T00:00:00Z')], now)).toBe(0);
    expect(deriveSavingsFundMonthly([], now)).toBe(0);
  });

  it('rounds to the nearest 10, so the pre-filled value lands on a slider step', () => {
    expect(
      deriveSavingsFundMonthly(
        [
          payment(157, '2026-07-05T00:00:00Z'),
          payment(157, '2026-06-05T00:00:00Z'),
          payment(157, '2026-05-05T00:00:00Z'),
        ],
        now,
      ),
    ).toBe(160);
  });
});

describe('deriveInitialBalance', () => {
  it('sums II and III pillar funds including the unavailable portion, rounded to 1000', () => {
    const balance = deriveInitialBalance([
      sourceFund(2, 10612.34, 500),
      sourceFund(3, 4500.66),
      sourceFund(null as unknown as 2, 9999), // no pillar -> ignored
    ]);
    expect(balance).toBe(16000); // (10612.34 + 500 + 4500.66) = 15613 -> 16000
  });

  it('returns 0 for no pillar funds', () => {
    expect(deriveInitialBalance([])).toBe(0);
  });
});

describe('deriveThirdPillarBalance', () => {
  it('sums only III pillar funds including the unavailable portion, rounded to 1000', () => {
    const balance = deriveThirdPillarBalance([
      sourceFund(2, 10612.34, 500),
      sourceFund(3, 4500.66),
      sourceFund(null as unknown as 2, 9999),
    ]);
    expect(balance).toBe(5000); // only the pillar-3 fund: 4500.66 -> 5000
  });

  it('returns 0 when there are no III pillar funds', () => {
    expect(deriveThirdPillarBalance([sourceFund(2, 12000)])).toBe(0);
  });
});

describe('derivePrefill', () => {
  const now = new Date('2026-07-01T00:00:00Z');

  const user = {
    age: 34,
    retirementAge: 65,
    secondPillarActive: true,
    secondPillarPaymentRates: { current: 4, pending: null },
  } as User;

  it('assembles every pre-filled input from the user, funds and contributions', () => {
    const prefill = derivePrefill(
      user,
      [sourceFund(2, 12000, 0), sourceFund(3, 3000)],
      [
        secondPillarContribution(96, '2026-06-10T00:00:00Z'),
        thirdPillarContribution(1200, '2026-05-15T00:00:00Z'),
      ],
      now,
    );

    expect(prefill).toEqual({
      currentAge: 34,
      retirementAge: 65,
      grossSalaryMonthly: 2000,
      initialBalance: 15000,
      initialThirdPillarBalance: 3000,
      currentSecondPillarRate: 4,
      currentThirdPillarMonthly: 100,
    });
  });

  it('clamps the prefilled III contribution to the salary-based tax ceiling', () => {
    // Gross 2000 => tax ceiling min(15% x 2000, 500) = 300/month. A saver whose
    // recent contributions average above that is pre-filled at the ceiling.
    const prefill = derivePrefill(
      user,
      [],
      [
        secondPillarContribution(80, '2026-06-10T00:00:00Z'), // gross 2000
        thirdPillarContribution(6000, '2026-05-15T00:00:00Z'), // 500/month, above ceiling
      ],
      now,
    );
    expect(prefill.grossSalaryMonthly).toBe(2000);
    expect(prefill.currentThirdPillarMonthly).toBe(300);
  });

  it('falls back to a sensible salary and retirement age when data is missing', () => {
    const prefill = derivePrefill(
      {
        age: 40,
        retirementAge: 0,
        secondPillarActive: true,
        secondPillarPaymentRates: { current: 2, pending: null },
      } as User,
      [],
      [],
      now,
    );
    expect(prefill.grossSalaryMonthly).toBeGreaterThan(0);
    expect(prefill.retirementAge).toBe(67);
    expect(prefill.initialBalance).toBe(0);
    expect(prefill.currentThirdPillarMonthly).toBe(0);
    expect(prefill.currentSecondPillarRate).toBe(2);
  });

  it('starts with no II rate selected for a saver who has left the II pillar', () => {
    const prefill = derivePrefill(
      {
        age: 45,
        retirementAge: 65,
        secondPillarActive: false,
        secondPillarPaymentRates: { current: 2, pending: null },
      } as User,
      [],
      [],
      now,
    );
    expect(prefill.currentSecondPillarRate).toBe(0);
  });
});

describe('selectSavingsFundPayments', () => {
  const savingsFund = { isin: 'EE0000003283', pillar: null } as Fund;
  const pensionFund = { isin: 'EE3600109435', pillar: 2 } as Fund;
  const transaction = (isin: string, amount: number, type = 'CONTRIBUTION_CASH'): Transaction =>
    ({ isin, amount, time: '2026-06-01T00:00:00Z', type } as Transaction);

  it('keeps only inflows into the fund with no pillar', () => {
    const payments = selectSavingsFundPayments(
      [savingsFund, pensionFund],
      [
        transaction('EE0000003283', 100),
        transaction('EE0000003283', 300, 'CONTRIBUTION_CASH_WORKPLACE'),
        transaction('EE0000003283', -50, 'SUBTRACTION'),
        transaction('EE3600109435', 200),
      ],
    );
    expect(payments).toEqual([
      { time: '2026-06-01T00:00:00Z', amount: 100 },
      { time: '2026-06-01T00:00:00Z', amount: 300 },
    ]);
  });

  it('keeps withdrawals when selecting all flows, so the past can dip', () => {
    const flows = selectSavingsFundFlows(
      [savingsFund, pensionFund],
      [
        transaction('EE0000003283', 100),
        transaction('EE0000003283', -50, 'SUBTRACTION'),
        transaction('EE3600109435', 200),
      ],
    );
    expect(flows).toEqual([
      { time: '2026-06-01T00:00:00Z', amount: 100 },
      { time: '2026-06-01T00:00:00Z', amount: -50 },
    ]);
  });
});

describe('deriveTulevaFees', () => {
  const fund = (overrides: Partial<Fund>): Fund =>
    ({
      status: 'ACTIVE',
      fundManager: { name: 'Tuleva' },
      ongoingChargesFigure: 0.0028,
      pillar: 2,
      ...overrides,
    } as Fund);

  it('reads each side from its own funds, so the two fees can differ', () => {
    const fees = deriveTulevaFees([
      fund({ pillar: 2, ongoingChargesFigure: 0.0028 }),
      fund({ pillar: null, ongoingChargesFigure: 0.0049 }),
    ]);
    expect(fees).toEqual({ pension: 0.0028, savingsFund: 0.0049 });
  });

  it('picks the cheapest fund and ignores other managers, inactive funds and zero fees', () => {
    const fees = deriveTulevaFees([
      fund({ ongoingChargesFigure: 0.0034 }),
      fund({ ongoingChargesFigure: 0.0028 }),
      fund({ ongoingChargesFigure: 0.0011, fundManager: { name: 'Swedbank' } as never }),
      fund({ ongoingChargesFigure: 0.0005, status: 'LIQUIDATED' as never }),
      fund({ ongoingChargesFigure: 0 }),
    ]);
    expect(fees.pension).toBe(0.0028);
  });

  it('falls back to the known Tuleva fee when the fund list is empty', () => {
    expect(deriveTulevaFees([])).toEqual({ pension: TULEVA_FEE, savingsFund: TULEVA_FEE });
  });
});
