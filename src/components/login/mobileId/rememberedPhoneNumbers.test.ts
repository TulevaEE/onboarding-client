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

  it('keeps a number until twelve months after the login that last confirmed it', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345', new Date('2026-10-01T09:00:00Z'));

    expect(rememberedMobileIdPhoneNumber('38888888888', new Date('2027-10-01T08:59:59Z'))).toBe(
      '+37255512345',
    );
    expect(
      rememberedMobileIdPhoneNumber('38888888888', new Date('2027-10-01T09:00:00Z')),
    ).toBeNull();
  });

  it('starts the twelve months again on every login that confirms the number', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345', new Date('2026-10-01T09:00:00Z'));
    rememberMobileIdPhoneNumber('38888888888', '+37255512345', new Date('2027-03-01T09:00:00Z'));

    expect(rememberedMobileIdPhoneNumber('38888888888', new Date('2028-02-29T09:00:00Z'))).toBe(
      '+37255512345',
    );
  });

  it('drops expired numbers from storage when it reads them', () => {
    rememberMobileIdPhoneNumber('38888888888', '+37255512345', new Date('2025-01-01T09:00:00Z'));
    rememberMobileIdPhoneNumber('48888888888', '+37255598765', new Date('2026-09-01T09:00:00Z'));

    rememberedMobileIdPhoneNumber('48888888888', new Date('2026-10-01T09:00:00Z'));

    expect(localStorage.getItem('mobileIdPhoneNumbers')).not.toContain('38888888888');
    expect(localStorage.getItem('mobileIdPhoneNumbers')).toContain('48888888888');
  });

  it('ignores an entry that does not say when it was confirmed', () => {
    localStorage.setItem('mobileIdPhoneNumbers', JSON.stringify({ '38888888888': '+37255512345' }));

    expect(rememberedMobileIdPhoneNumber('38888888888')).toBeNull();
  });

  it('shows only the last three digits', () => {
    expect(lastDigits('+37255512345')).toBe('345');
  });
});
