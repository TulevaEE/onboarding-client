type Redaction = (text: string) => string;

export const TOKEN_PLACEHOLDER = '[token]';
const IBAN_PLACEHOLDER = '[iban]';

const SECRET_PARAMETER_NAMES = ['handoverToken'];

export const isSecretParameter = (name: string): boolean =>
  SECRET_PARAMETER_NAMES.some((secret) => secret.toLowerCase() === name.toLowerCase());

const SECRET_PARAMETER = new RegExp(
  `((?:${SECRET_PARAMETER_NAMES.join('|')})(?:=|%3D))[^&#\\s"']+`,
  'gi',
);

const SIGNED_TOKEN = /eyJ[\w-]{10,}(?:\.[\w-]*){0,2}/g;

const EMAIL_LOCAL_PART = "[\\w.%+'\\u00c0-\\u024f-]";
const EMAIL_DOMAIN_LABEL = '[a-z\\d\\u00c0-\\u024f-]+';
const EMAIL_ADDRESS = new RegExp(
  `(^|[^\\w.%+'\\u00c0-\\u024f-])${EMAIL_LOCAL_PART}+(?:@|%40)${EMAIL_DOMAIN_LABEL}(?:\\.${EMAIL_DOMAIN_LABEL})*\\.[a-z]{2,}`,
  'gi',
);

const IBAN_GROUP_SEPARATOR = '[ \\t\\u00a0\\u202f-]{1,2}';
const NEXT_IBAN = '[A-Z]{2}\\d{2}';

// An ISIN has 12 characters and the shortest IBAN 15, so the length keeps fund ISINs like EE3600109435 out.
const UPPERCASE_IBAN = new RegExp(
  `[A-Z]{2}\\d{2}(?:[A-Z\\d]{11,30}|(?:${IBAN_GROUP_SEPARATOR}(?!${NEXT_IBAN})[A-Z\\d]{4}){2,7}(?:${IBAN_GROUP_SEPARATOR}(?!${NEXT_IBAN})[A-Z\\d]{1,4})?)(?=$|[^A-Za-z\\d]|${NEXT_IBAN}|[A-Z][a-z])`,
  'g',
);

const LOWERCASE_IBAN = new RegExp(
  `[a-z]{2}\\d{2}(?:[a-z\\d]{11,30}|(?:${IBAN_GROUP_SEPARATOR}[a-z\\d]{4}){2,7}(?:${IBAN_GROUP_SEPARATOR}[a-z\\d]{1,4})?)(?![a-z\\d])`,
  'g',
);

const PERSONAL_CODE = /(^|\D)[1-6]\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{4}(?!\d)/g;

const PHONE_SEPARATOR = '[ \\u00a0\\u202f-]';

const PHONE_NUMBER_WITH_COUNTRY_CODE = new RegExp(
  `(^|[^\\d+(])\\(?(?:\\+|00)372\\)?${PHONE_SEPARATOR}?\\d(?:${PHONE_SEPARATOR}?\\d){6,7}(?!\\d)`,
  'g',
);

const ROUND_NUMBER = `[58]0{2,3}${PHONE_SEPARATOR}`;

const GROUPED_MOBILE_NUMBER = new RegExp(
  `(^|[^\\d.,])(?!${ROUND_NUMBER})[58]\\d{2,3}${PHONE_SEPARATOR}\\d{4}(?!\\d|[.,]\\d)`,
  'g',
);

const replacing =
  (pattern: RegExp, replacement: string): Redaction =>
  (text) =>
    text.replace(pattern, replacement);

const IBAN_LETTER_TO_NUMBER_OFFSET = 55;

const ibanRemainder = (iban: string): number => {
  const compact = iban.replace(/[^A-Za-z\d]/g, '').toUpperCase();
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (letter) =>
    String(letter.charCodeAt(0) - IBAN_LETTER_TO_NUMBER_OFFSET),
  );
  return digits.split('').reduce((remainder, digit) => (remainder * 10 + Number(digit)) % 97, 0);
};

const hasValidCheckDigits = (iban: string): boolean => ibanRemainder(iban) === 1;

const redactIbansStartingAWord =
  (pattern: RegExp, partOfWord: RegExp, isIban: (candidate: string) => boolean): Redaction =>
  (text) => {
    let previousIbanEnd = -1;
    return text.replace(pattern, (candidate: string, offset: number) => {
      const startsAWord =
        offset === 0 || offset === previousIbanEnd || !partOfWord.test(text[offset - 1]);
      if (!startsAWord || !isIban(candidate)) {
        return candidate;
      }
      previousIbanEnd = offset + candidate.length;
      return IBAN_PLACEHOLDER;
    });
  };

const REDACTIONS: Redaction[] = [
  replacing(SECRET_PARAMETER, `$1${TOKEN_PLACEHOLDER}`),
  replacing(SIGNED_TOKEN, TOKEN_PLACEHOLDER),
  replacing(EMAIL_ADDRESS, '$1[email]'),
  redactIbansStartingAWord(UPPERCASE_IBAN, /[A-Z\d]/, () => true),
  redactIbansStartingAWord(LOWERCASE_IBAN, /[A-Za-z\d]/, hasValidCheckDigits),
  replacing(PERSONAL_CODE, '$1[isikukood]'),
  replacing(PHONE_NUMBER_WITH_COUNTRY_CODE, '$1[phone]'),
  replacing(GROUPED_MOBILE_NUMBER, '$1[phone]'),
];

export const redactPii = (text: string): string =>
  REDACTIONS.reduce((redacted, redact) => redact(redacted), text);

export const containsPii = (text: string): boolean => redactPii(text) !== text;
