const STORAGE_KEY = 'mobileIdPhoneNumbers';
const VISIBLE_DIGITS = 3;
const MONTHS_KEPT_AFTER_LAST_LOGIN = 12;

type RememberedPhoneNumber = { phoneNumber: string; confirmedAt: number };
type PhoneNumbersByPersonalCode = Record<string, RememberedPhoneNumber>;

const isRememberedPhoneNumber = (entry: unknown): entry is RememberedPhoneNumber =>
  typeof (entry as RememberedPhoneNumber)?.phoneNumber === 'string' &&
  typeof (entry as RememberedPhoneNumber)?.confirmedAt === 'number';

const expiresAt = ({ confirmedAt }: RememberedPhoneNumber): number => {
  const expiry = new Date(confirmedAt);
  expiry.setMonth(expiry.getMonth() + MONTHS_KEPT_AFTER_LAST_LOGIN);
  return expiry.getTime();
};

function readStored(): Record<string, unknown> {
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

function readCurrent(now: Date): PhoneNumbersByPersonalCode {
  const stored = readStored();
  const current: PhoneNumbersByPersonalCode = Object.fromEntries(
    Object.entries(stored).filter(
      (entry): entry is [string, RememberedPhoneNumber] =>
        isRememberedPhoneNumber(entry[1]) && expiresAt(entry[1]) > now.getTime(),
    ),
  );
  if (Object.keys(current).length !== Object.keys(stored).length) {
    writeAll(current);
  }
  return current;
}

export function rememberedMobileIdPhoneNumber(
  personalCode: string,
  now: Date = new Date(),
): string | null {
  return readCurrent(now)[personalCode]?.phoneNumber ?? null;
}

export function rememberMobileIdPhoneNumber(
  personalCode: string,
  phoneNumber: string,
  now: Date = new Date(),
): void {
  writeAll({ ...readCurrent(now), [personalCode]: { phoneNumber, confirmedAt: now.getTime() } });
}

export function forgetMobileIdPhoneNumber(personalCode: string, now: Date = new Date()): void {
  writeAll(
    Object.fromEntries(Object.entries(readCurrent(now)).filter(([code]) => code !== personalCode)),
  );
}

export function lastDigits(phoneNumber: string): string {
  return phoneNumber.slice(-VISIBLE_DIGITS);
}
