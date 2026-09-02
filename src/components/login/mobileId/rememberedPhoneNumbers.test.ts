import {
  forgetMobileIdPhoneNumber,
  lastDigits,
  rememberMobileIdPhoneNumber,
  rememberedMobileIdPhoneNumber,
} from './rememberedPhoneNumbers';

describe('remembered Mobile-ID phone numbers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('knows nothing about a personal code it has not seen', () => {
    expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
  });

  it('remembers a phone number for a personal code across reads', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');

    expect(rememberedMobileIdPhoneNumber('38888888888')).toBe('+37255512345');
    expect(rememberedMobileIdPhoneNumber('48888888888')).toBeNull();
  });

  it('keeps one phone number per personal code', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');
    rememberMobileIdPhoneNumber('48888888888', '+37255598765');
    rememberMobileIdPhoneNumber('38888888888', '+37255500000');

    expect(rememberedMobileIdPhoneNumber('38888888888')).toBe('+37255500000');
    expect(rememberedMobileIdPhoneNumber('48888888888')).toBe('+37255598765');
  });

  it('forgets a single personal code', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');
    rememberMobileIdPhoneNumber('48888888888', '+37255598765');

    forgetMobileIdPhoneNumber('38888888888');

    expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
    expect(rememberedMobileIdPhoneNumber('48888888888')).toBe('+37255598765');
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('mobileIdPhoneNumbers', 'not json');

    expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
    rememberMobileIdPhoneNumber('38888888888', '+37255512345');
    expect(rememberedMobileIdPhoneNumber('38888888888')).toBe('+37255512345');
  });

  it('shows only the last three digits', () => {
    expect(lastDigits('+37255512345')).toBe('345');
  });
});
