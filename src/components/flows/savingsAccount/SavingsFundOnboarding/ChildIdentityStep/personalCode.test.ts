import { isValidEstonianPersonalCode } from './personalCode';

describe('isValidEstonianPersonalCode', () => {
  it('accepts valid Estonian personal ID codes', () => {
    expect(isValidEstonianPersonalCode('61506150006')).toBe(true);
    expect(isValidEstonianPersonalCode('38001085718')).toBe(true);
  });

  it('rejects a code with an invalid control digit', () => {
    // 11 digits and a real date, but the checksum does not match.
    expect(isValidEstonianPersonalCode('61509070000')).toBe(false);
  });

  it('rejects anything that is not exactly 11 digits', () => {
    expect(isValidEstonianPersonalCode('123')).toBe(false);
    expect(isValidEstonianPersonalCode('615061500061')).toBe(false);
    expect(isValidEstonianPersonalCode('6150615000a')).toBe(false);
    expect(isValidEstonianPersonalCode('')).toBe(false);
  });

  it('rejects an implausible leading digit or birth date', () => {
    expect(isValidEstonianPersonalCode('01506150006')).toBe(false); // leading 0
    expect(isValidEstonianPersonalCode('61513150006')).toBe(false); // month 13
    expect(isValidEstonianPersonalCode('61506320006')).toBe(false); // day 32
  });
});
