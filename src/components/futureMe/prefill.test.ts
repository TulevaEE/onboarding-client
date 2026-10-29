import { mockUser } from '../../test/backend-responses';
import { Contribution, SourceFund } from '../common/apiModels';
import {
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  deriveBirthYear,
  deriveGrossMonthly,
  derivePillarAmount,
  derivePrefill,
  deriveSex,
  deriveThirdPillarJoined,
  deriveThirdPillarMonthly,
  parseBirthYear,
} from './prefill';

const TODAY = new Date('2026-10-28T12:00:00Z');

const secondPillarPayment = (time: string, socialTaxPortion: number): Contribution => ({
  time,
  sender: 'Employer',
  amount: socialTaxPortion * 1.5,
  currency: 'EUR',
  pillar: 2,
  additionalParentalBenefit: 0,
  employeeWithheldPortion: socialTaxPortion / 2,
  socialTaxPortion,
  interest: 0,
});

const parentalBenefitPayment = (time: string): Contribution => ({
  time,
  sender: 'Riik',
  amount: 76.12,
  currency: 'EUR',
  pillar: 2,
  additionalParentalBenefit: 76.12,
  employeeWithheldPortion: 0,
  socialTaxPortion: 0,
  interest: 0,
});

const thirdPillarPayment = (time: string, amount: number): Contribution => ({
  time,
  sender: 'Me',
  amount,
  currency: 'EUR',
  pillar: 3,
});

const fund = (pillar: 2 | 3, price: number, unavailablePrice = 0): SourceFund => ({
  isin: `EE${pillar}${price}`,
  name: 'Fund',
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  pillar,
  managementFeePercent: 0.3,
  price,
  unavailablePrice,
  currency: 'EUR',
  ongoingChargesFigure: 0.004,
  contributions: price,
  subtractions: 0,
  profit: 0,
  units: price,
});

describe('birth year from the date of birth', () => {
  it('reads the year of an ISO date', () => {
    expect(deriveBirthYear('1989-01-01')).toBe(1989);
  });

  it('reads the year from the text, so the time zone cannot move it across New Year', () => {
    expect(deriveBirthYear('1990-01-01T00:00:00')).toBe(1990);
    expect(deriveBirthYear('1990-12-31')).toBe(1990);
  });

  it.each(['', 'unknown', '89-01-01'])('gives nothing for %p', (dateOfBirth) => {
    expect(deriveBirthYear(dateOfBirth)).toBeNull();
  });

  it('gives nothing outside the supported years', () => {
    expect(deriveBirthYear(`${BIRTH_YEAR_MIN - 1}-05-05`)).toBeNull();
    expect(deriveBirthYear(`${BIRTH_YEAR_MAX + 1}-05-05`)).toBeNull();
  });

  it('keeps the first and last supported year', () => {
    expect(deriveBirthYear(`${BIRTH_YEAR_MIN}-05-05`)).toBe(BIRTH_YEAR_MIN);
    expect(deriveBirthYear(`${BIRTH_YEAR_MAX}-05-05`)).toBe(BIRTH_YEAR_MAX);
  });
});

describe('sex from the personal code', () => {
  it.each(['1', '3', '5', '7'])('reads a code starting with %s as male', (digit) => {
    expect(deriveSex(`${digit}9001011234`.padEnd(11, '0'))).toBe('M');
  });

  it.each(['2', '4', '6', '8'])('reads a code starting with %s as female', (digit) => {
    expect(deriveSex(`${digit}9001011234`.padEnd(11, '0'))).toBe('N');
  });

  it.each(['', '0', '9001011234', '3900101123', '390010112345', '3900101123a', '12345678'])(
    'gives nothing for %p',
    (personalCode) => {
      expect(deriveSex(personalCode)).toBeNull();
    },
  );

  it('gives nothing for a first digit that names no sex', () => {
    expect(deriveSex('09001011234')).toBeNull();
    expect(deriveSex('99001011234')).toBeNull();
  });
});

describe('prefill for the You step', () => {
  it('takes the birth year and sex from the user', () => {
    expect(derivePrefill(mockUser)).toMatchObject({ birthYear: 1989, sex: 'M' });
  });

  it('leaves out what the user does not tell', () => {
    expect(derivePrefill({ ...mockUser, dateOfBirth: '', personalCode: '12345678' })).toMatchObject(
      {
        birthYear: null,
        sex: null,
      },
    );
  });

  it.each([2, 4, 6] as const)('takes the current II pillar payment rate of %i%', (current) => {
    const user = { ...mockUser, secondPillarPaymentRates: { current, pending: null } };

    expect(derivePrefill(user).secondPillarRate).toBe(String(current / 100));
  });

  it('reads a user outside the II pillar as paying nothing into it', () => {
    expect(derivePrefill({ ...mockUser, secondPillarActive: false }).secondPillarRate).toBe('0');
  });
});

describe('III pillar join from the user', () => {
  it.each([
    ['2019-01-01', 'before'],
    ['2020-12-31', 'before'],
    ['2021-01-01', 'after'],
    [null, 'none'],
  ] as const)('reads %p as %p', (thirdPillarInitDate, joined) => {
    expect(deriveThirdPillarJoined({ ...mockUser, thirdPillarInitDate })).toBe(joined);
  });
});

describe('gross salary from the II pillar contributions', () => {
  it('is the social tax part of the latest month divided by 4%', () => {
    const contributions = [
      secondPillarPayment('2026-08-10T08:00:00Z', 80),
      secondPillarPayment('2026-09-10T08:00:00Z', 100),
    ];

    expect(deriveGrossMonthly(contributions, TODAY)).toBe('2500');
  });

  it('adds up the payments of several employers in the same month', () => {
    const contributions = [
      secondPillarPayment('2026-09-05T08:00:00Z', 60),
      secondPillarPayment('2026-09-20T08:00:00Z', 20),
    ];

    expect(deriveGrossMonthly(contributions, TODAY)).toBe('2000');
  });

  it('still reads a payment three months back, as payments arrive late', () => {
    expect(deriveGrossMonthly([secondPillarPayment('2026-07-10', 80)], TODAY)).toBe('2000');
  });

  it("gives nothing when the latest payment is older, so an old salary is not taken as today's", () => {
    expect(deriveGrossMonthly([secondPillarPayment('2026-06-10', 80)], TODAY)).toBeNull();
  });

  it.each([
    ['there are no payments', []],
    ['only the III pillar was paid into', [thirdPillarPayment('2026-09-10', 100)]],
    ['the payment has no social tax part', [secondPillarPayment('2026-09-10', 0)]],
  ])('gives nothing when %s', (_, contributions) => {
    expect(deriveGrossMonthly(contributions, TODAY)).toBeNull();
  });
});

describe('III pillar monthly payment from the contributions', () => {
  it('averages the last 12 months, so a yearly payment counts as a twelfth', () => {
    expect(deriveThirdPillarMonthly([thirdPillarPayment('2025-12-20', 1200)], TODAY)).toBe('100');
  });

  it('adds up every payment within the 12 months and rounds to euros', () => {
    const contributions = [
      thirdPillarPayment('2026-01-10', 100),
      thirdPillarPayment('2026-10-10', 105),
    ];

    expect(deriveThirdPillarMonthly(contributions, TODAY)).toBe('17');
  });

  it('takes the latest month of a standing order, however recently it started', () => {
    const contributions = [
      thirdPillarPayment('2026-08-05', 200),
      thirdPillarPayment('2026-09-05', 200),
      thirdPillarPayment('2026-10-05', 250),
    ];

    expect(deriveThirdPillarMonthly(contributions, TODAY)).toBe('250');
  });

  it('leaves out payments older than 12 months', () => {
    const contributions = [
      thirdPillarPayment('2025-10-28', 1200),
      thirdPillarPayment('2025-11-02', 120),
    ];

    expect(deriveThirdPillarMonthly(contributions, TODAY)).toBe('10');
  });

  it.each([
    ['there are no payments', []],
    ['only the II pillar was paid into', [secondPillarPayment('2026-09-10', 80)]],
  ])('gives nothing when %s', (_, contributions) => {
    expect(deriveThirdPillarMonthly(contributions, TODAY)).toBeNull();
  });
});

describe('pillar amount from the pension account', () => {
  it('adds up the value of every fund of the pillar, rounded to euros', () => {
    const funds = [fund(2, 1000.4), fund(2, 500, 100.3), fund(3, 9999)];

    expect(derivePillarAmount(funds, 2)).toBe('1601');
    expect(derivePillarAmount(funds, 3)).toBe('9999');
  });

  it('gives nothing without money in the pillar', () => {
    expect(derivePillarAmount([fund(3, 100)], 2)).toBeNull();
    expect(derivePillarAmount([fund(2, 0)], 2)).toBeNull();
  });
});

describe('prefill from the pension data', () => {
  it('adds the salary, amounts, III pillar payment and join to the user prefill', () => {
    const prefill = derivePrefill(
      { ...mockUser, thirdPillarInitDate: '2019-01-01' },
      {
        contributions: [
          secondPillarPayment('2026-09-10', 80),
          thirdPillarPayment('2026-05-10', 600),
        ],
        sourceFunds: [fund(2, 24586.29), fund(3, 8117.43)],
      },
      TODAY,
    );

    expect(prefill).toMatchObject({
      grossMonthly: '2000',
      secondPillarAmount: '24586',
      thirdPillarAmount: '8117',
      thirdPillarMonthly: '50',
      thirdPillarJoined: 'before',
    });
  });

  it('does not call a saver with III pillar money unjoined when the join date is missing', () => {
    const prefill = derivePrefill(
      { ...mockUser, thirdPillarInitDate: null },
      { sourceFunds: [fund(3, 8117.43)] },
      TODAY,
    );

    expect(prefill.thirdPillarJoined).toBeNull();
  });

  it('leaves the state payment months of a child under three empty, as the state is still paying', () => {
    const prefill = derivePrefill(
      mockUser,
      {
        contributions: [parentalBenefitPayment('2026-09-10')],
        children: [{ personalCode: '62312100000' }],
      },
      TODAY,
    );

    expect(prefill.kids).toEqual({ birthYears: [2023], birthMonths: [12], iiMonths: [''] });
  });

  it('leaves the pension data fields empty when it could not be loaded', () => {
    expect(derivePrefill(mockUser)).toMatchObject({
      grossMonthly: null,
      secondPillarAmount: null,
      thirdPillarAmount: null,
      thirdPillarMonthly: null,
    });
  });
});

describe('typed birth year', () => {
  it.each([
    ['1980', 1980],
    [' 1980 ', 1980],
    [`${BIRTH_YEAR_MIN}`, BIRTH_YEAR_MIN],
    [`${BIRTH_YEAR_MAX}`, BIRTH_YEAR_MAX],
  ])('accepts %p', (typed, expected) => {
    expect(parseBirthYear(typed)).toBe(expected);
  });

  it.each([
    '',
    'abc',
    '1980.5',
    `${BIRTH_YEAR_MIN - 1}`,
    `${BIRTH_YEAR_MAX + 1}`,
    '19800',
    '-1980',
  ])('rejects %p', (typed) => {
    expect(parseBirthYear(typed)).toBeNull();
  });
});
