import { Contribution } from '../common/apiModels';
import { childBirthOf, deriveKidsPrefill } from './kidsPrefill';

const A_GIRL_BORN_FEB_2023 = '62302200000';
const A_BOY_BORN_JUNE_2015 = '51506150000';

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

  it('takes the birth months from the personal codes', () => {
    expect(deriveKidsPrefill(children, [])?.birthMonths).toEqual([6, 2]);
  });

  it('counts the months the state paid into the parent II pillar after the child was born', () => {
    const contributions = monthsFrom(2023, 3, 30).map((time) => parentalBenefit(time));

    expect(deriveKidsPrefill(children, contributions)?.iiMonths).toEqual(['', '30']);
  });

  it('counts the months for a child born from September 2021', () => {
    const bornOctober2021 = [{ personalCode: '62110100000' }];
    const contributions = monthsFrom(2021, 11, 16).map((time) => parentalBenefit(time));

    expect(deriveKidsPrefill(bornOctober2021, contributions)?.iiMonths).toEqual(['16']);
  });

  it('leaves the months empty for a child still under 3, whose months the calculation does not ask', () => {
    const bornNovember2023 = [{ personalCode: '62311100000' }];
    const contributions = monthsFrom(2023, 12, 35).map((time) => parentalBenefit(time));

    expect(
      deriveKidsPrefill(bornNovember2023, contributions, new Date(2026, 9, 28))?.iiMonths,
    ).toEqual(['']);
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
