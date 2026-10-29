import { Contribution } from '../common/apiModels';
import { attributableIIMonths, childBirthOf, deriveKidsPrefill } from './kidsPrefill';

const A_GIRL_BORN_FEB_2023 = '62302200000';
const A_BOY_BORN_JUNE_2015 = '51506150000';
const A_GIRL_BORN_DEC_2023 = '62312100000';

const monthsFrom = (year: number, month: number, count: number): string[] =>
  Array.from({ length: count }, (_, offset) => {
    const index = year * 12 + month - 1 + offset;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-10T08:00:00Z`;
  });

const parentalBenefit = (time: string, additionalParentalBenefit = 50): Contribution => ({
  time,
  sender: 'Riik',
  amount: additionalParentalBenefit,
  currency: 'EUR',
  pillar: 2,
  additionalParentalBenefit,
  employeeWithheldPortion: 0,
  socialTaxPortion: 0,
  interest: 0,
});

describe('birth date from the personal code of a child', () => {
  it.each([
    ['51506150000', { year: 2015, month: 6 }],
    ['62302200000', { year: 2023, month: 2 }],
    ['39001011234', { year: 1990, month: 1 }],
    ['49912310000', { year: 1999, month: 12 }],
  ])('reads %p as %p', (personalCode, birth) => {
    expect(childBirthOf(personalCode)).toEqual(birth);
  });

  it.each([
    '',
    '5150615000',
    '515061500000',
    '51500150000',
    '51513150000',
    'abcdefghijk',
    '01506150000',
  ])('gives nothing for %p', (personalCode) => {
    expect(childBirthOf(personalCode)).toBeNull();
  });
});

describe('children prefill from the register and the contributions', () => {
  const children = [{ personalCode: A_BOY_BORN_JUNE_2015 }, { personalCode: A_GIRL_BORN_FEB_2023 }];

  it('leaves the months empty for children whose payment years overlap, as a payment names no child', () => {
    const siblings = [{ personalCode: '52201100000' }, { personalCode: '62301100000' }];
    const contributions = monthsFrom(2022, 2, 36).map((time) => parentalBenefit(time));

    expect(deriveKidsPrefill(siblings, contributions)?.iiMonths).toEqual(['', '']);
  });

  it('takes the birth years in the order of the register', () => {
    expect(deriveKidsPrefill(children, [])?.birthYears).toEqual([2015, 2023]);
  });

  it('counts the months the state paid into the parent II pillar after the child was born', () => {
    const contributions = monthsFrom(2023, 3, 30).map((time) => parentalBenefit(time));

    expect(deriveKidsPrefill(children, contributions)?.iiMonths).toEqual(['', '30']);
  });

  it('counts a month with two payments once', () => {
    const contributions = [...monthsFrom(2023, 3, 12), ...monthsFrom(2023, 3, 12)].map((time) =>
      parentalBenefit(time),
    );

    expect(deriveKidsPrefill(children, contributions)?.iiMonths).toEqual(['', '12']);
  });

  it('leaves out months with no parental benefit and months before the birth', () => {
    const contributions = [
      parentalBenefit('2022-12-10T08:00:00Z'),
      parentalBenefit('2023-04-10T08:00:00Z', 0),
      parentalBenefit('2023-05-10T08:00:00Z'),
    ];

    expect(deriveKidsPrefill(children, contributions)?.iiMonths).toEqual(['', '1']);
  });

  it('leaves out months more than 36 months after the birth, which belong to a younger child', () => {
    const contributions = monthsFrom(2023, 3, 36).map((time) => parentalBenefit(time));
    const afterThirdBirthday = parentalBenefit('2026-04-10T08:00:00Z');

    expect(deriveKidsPrefill(children, [...contributions, afterThirdBirthday])?.iiMonths).toEqual([
      '',
      '36',
    ]);
  });

  it('never gives more than 36 months', () => {
    const contributions = monthsFrom(2023, 2, 37).map((time) => parentalBenefit(time));

    expect(deriveKidsPrefill(children, contributions)?.iiMonths).toEqual(['', '36']);
  });

  it('leaves the months empty while the state is still paying for a child under three', () => {
    const paidSoFar = monthsFrom(2024, 1, 34).map((time) => parentalBenefit(time));

    expect(
      deriveKidsPrefill(
        [{ personalCode: A_GIRL_BORN_DEC_2023 }],
        paidSoFar,
        new Date('2026-10-15T12:00:00Z'),
      )?.iiMonths,
    ).toEqual(['']);
  });

  it('counts the months once the three years of state payments are over', () => {
    const paid = monthsFrom(2024, 1, 34).map((time) => parentalBenefit(time));

    expect(
      deriveKidsPrefill(
        [{ personalCode: A_GIRL_BORN_DEC_2023 }],
        paid,
        new Date('2027-01-15T12:00:00Z'),
      )?.iiMonths,
    ).toEqual(['34']);
  });

  it('leaves the months empty when no payment can be found, so the saver says it', () => {
    expect(deriveKidsPrefill(children, [])?.iiMonths).toEqual(['', '']);
    expect(deriveKidsPrefill(children, undefined)?.iiMonths).toEqual(['', '']);
  });

  it('skips a child whose personal code cannot be read', () => {
    const prefill = deriveKidsPrefill([{ personalCode: 'x' }, ...children], []);

    expect(prefill?.birthYears).toEqual([2015, 2023]);
  });

  it.each([[undefined], [[]], [[{ personalCode: 'x' }]]])('gives nothing for %p', (given) => {
    expect(deriveKidsPrefill(given, [])).toBeNull();
  });
});

describe('prefilled months once the saver enters more children', () => {
  const prefill = { birthYears: [2015, 2023], iiMonths: ['', '24'] };

  it.each(['2020', '2022', '2026'])(
    'clears them when an added child is born in %p, within three years, as a payment names no child',
    (added) => {
      expect(attributableIIMonths(prefill, ['2015', '2023', added], ['', '24', ''])).toEqual([
        '',
        '',
        '',
      ]);
    },
  );

  it.each(['2019', '2027', '', '202'])(
    'keeps them while the added child is born four or more years apart or its year is not typed yet: %p',
    (added) => {
      expect(attributableIIMonths(prefill, ['2015', '2023', added], ['', '24', ''])).toEqual([
        '',
        '24',
        '',
      ]);
    },
  );

  it('clears them when the saver changes the year of another prefilled child to within three years', () => {
    expect(attributableIIMonths(prefill, ['2021', '2023'], ['', '24'])).toEqual(['', '']);
  });

  it('keeps a month count the saver typed', () => {
    expect(attributableIIMonths(prefill, ['2015', '2023', '2022'], ['', '12', ''])).toEqual([
      '',
      '12',
      '',
    ]);
  });

  it('keeps the months when nothing was prefilled', () => {
    expect(attributableIIMonths(null, ['2023', '2022'], ['12', ''])).toEqual(['12', '']);
  });
});
