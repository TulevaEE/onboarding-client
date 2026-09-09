const STORAGE_KEY = 'mobileIdPhoneNumbers';
const VISIBLE_DIGITS = 3;

type PhoneNumbersByPersonalCode = Record<string, string>;

function readAll(): PhoneNumbersByPersonalCode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeAll(phoneNumbers: PhoneNumbersByPersonalCode): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(phoneNumbers));
    return true;
  } catch (error) {
    return false;
  }
}

export function rememberedMobileIdPhoneNumber(personalCode: string): string | null {
  return readAll()[personalCode] ?? null;
}

export function rememberMobileIdPhoneNumber(personalCode: string, phoneNumber: string): void {
  writeAll({ ...readAll(), [personalCode]: phoneNumber });
}

export function forgetMobileIdPhoneNumber(personalCode: string): void {
  writeAll(Object.fromEntries(Object.entries(readAll()).filter(([code]) => code !== personalCode)));
}

export function lastDigits(phoneNumber: string): string {
  return phoneNumber.slice(-VISIBLE_DIGITS);
}
