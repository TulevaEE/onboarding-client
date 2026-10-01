import { isValidPersonalCode } from './personalCode';

describe('isValidPersonalCode', () => {
  it.each(['61506150006', '38001085718', '49602290004'])('accepts the personal code %s', (code) => {
    expect(isValidPersonalCode(code)).toBe(true);
  });

  it('rejects a code with an invalid control digit', () => {
    expect(isValidPersonalCode('61509070000')).toBe(false);
  });

  it.each(['123', '615061500061', '6150615000a', '', ' 6150615000'])(
    'rejects %p, which is not exactly 11 digits',
    (code) => {
      expect(isValidPersonalCode(code)).toBe(false);
    },
  );

  it.each([
    ['a leading 0', '01506150006'],
    ['a leading 7, a birth in the 22nd century', '71506150007'],
    ['month 13', '61513150006'],
    ['day 32', '61506320008'],
    ['30 February', '38002300003'],
    ['29 February in a year that is not a leap year', '38102290008'],
  ])('rejects a code with %s', (_, code) => {
    expect(isValidPersonalCode(code)).toBe(false);
  });
});
