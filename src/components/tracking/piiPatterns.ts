interface Redaction {
  pattern: RegExp;
  replacement: string;
}

const SIGNED_TOKEN = /eyJ[\w-]+\.eyJ[\w-]+\.[\w-]*/g;

const EMAIL_ADDRESS = /[\w.%+-]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,}/gi;

// An ISIN has 12 characters and the shortest IBAN 15, so the length keeps fund ISINs like EE3600109435 out.
const IBAN =
  /(^|[^A-Za-z\d])[A-Z]{2}\d{2}(?:[A-Z\d]{11,30}|(?:[  ](?![A-Z]{2}\d{2})[A-Z\d]{4}){2,7}(?:[  ](?![A-Z]{2}\d{2})[A-Z\d]{1,4})?)(?![A-Za-z\d])/g;

const PERSONAL_CODE = /(^|\D)[1-6]\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{4}(?!\d)/g;

const PHONE_NUMBER_WITH_COUNTRY_CODE = /(^|[^\d+])(?:\+|00)372[  -]?\d(?:[  -]?\d){6,7}(?!\d)/g;

const GROUPED_MOBILE_NUMBER = /(^|[^\d.,])5\d{2,3}[  ]\d{4}(?!\d|[.,]\d)/g;

const REDACTIONS: Redaction[] = [
  { pattern: SIGNED_TOKEN, replacement: '[token]' },
  { pattern: EMAIL_ADDRESS, replacement: '[email]' },
  { pattern: IBAN, replacement: '$1[iban]' },
  { pattern: PERSONAL_CODE, replacement: '$1[isikukood]' },
  { pattern: PHONE_NUMBER_WITH_COUNTRY_CODE, replacement: '$1[phone]' },
  { pattern: GROUPED_MOBILE_NUMBER, replacement: '$1[phone]' },
];

export const redactPii = (text: string): string =>
  REDACTIONS.reduce(
    (redacted, { pattern, replacement }) => redacted.replace(pattern, replacement),
    text,
  );

export const containsPii = (text: string): boolean => redactPii(text) !== text;
