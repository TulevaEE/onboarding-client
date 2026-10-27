import { mockUser } from '../../test/backend-responses';
import {
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  deriveBirthYear,
  derivePrefill,
  deriveSex,
  parseBirthYear,
} from './prefill';

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
