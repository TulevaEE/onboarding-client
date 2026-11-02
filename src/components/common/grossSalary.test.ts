import { deriveGrossSalary } from './grossSalary';
import { Contribution, SecondPillarContribution, ThirdPillarContribution } from './apiModels';

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
