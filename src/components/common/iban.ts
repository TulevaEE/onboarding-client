const IBAN_CODE_LENGTHS = {
  EE: 20,
  AL: 28,
  AD: 24,
  AT: 20,
  AZ: 28,
  BH: 22,
  BE: 16,
  BA: 20,
  BR: 29,
  BG: 22,
  CR: 22,
  HR: 21,
  CY: 28,
  CZ: 24,
  FO: 18,
  GL: 18,
  DK: 18,
  DO: 28,
  EG: 29,
  FI: 18,
  FR: 27,
  GE: 22,
  DE: 22,
  GI: 23,
  GR: 27,
  GT: 28,
  HU: 28,
  IS: 26,
  IE: 22,
  IL: 23,
  IT: 27,
  JO: 30,
  KZ: 20,
  XK: 20,
  KW: 30,
  LV: 21,
  LB: 28,
  LI: 21,
  LT: 20,
  LU: 20,
  MK: 19,
  MT: 31,
  MR: 27,
  MU: 30,
  MD: 24,
  MC: 27,
  ME: 22,
  NL: 18,
  NO: 15,
  PK: 24,
  PS: 29,
  PL: 28,
  PT: 25,
  QA: 29,
  RO: 24,
  SM: 27,
  LC: 32,
  ST: 25,
  SA: 24,
  RS: 22,
  SK: 24,
  SI: 19,
  ES: 24,
  SE: 24,
  CH: 21,
  TL: 23,
  TN: 24,
  TR: 26,
  AE: 23,
  GB: 22,
  VA: 22,
  VG: 24,
  UA: 29,
  SC: 31,
  IQ: 23,
  BY: 28,
  SV: 28,
  LY: 25,
  SD: 18,
  BI: 27,
  DJ: 27,
  RU: 33,
  SO: 23,
  NI: 28,
  MN: 20,
  FK: 18,
  OM: 23,
  YE: 30,
  HN: 28,
};

const ESTONIAN_IBAN_CHECK_CODE_TO_BANK_NAME = {
  42: 'Coop Pank',
  10: 'SEB',
  22: 'Swedbank',
  96: 'Luminor',
  17: 'Luminor',
  77: 'LHV',
  75: 'Bigbank',
  12: 'Citadele',
};

export const getBankName = (iban: string): string | null => {
  if (!isValidIban(iban)) {
    return null;
  }

  const country = getIbanCountry(iban);

  if (country !== 'EE') {
    return null;
  }

  const checkDigits = Number(
    preProcessIban(iban).substring(4, 6),
  ) as keyof typeof ESTONIAN_IBAN_CHECK_CODE_TO_BANK_NAME;

  return ESTONIAN_IBAN_CHECK_CODE_TO_BANK_NAME[checkDigits] ?? null;
};

export const preProcessIban = (iban: string) => iban.trim().replace(/\s/g, '').toUpperCase();

const getIbanCountry = (input: string): keyof typeof IBAN_CODE_LENGTHS | null => {
  const iban = String(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // keep only alphanumeric characters
  const code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/);

  if (!code) {
    return null;
  }

  const countryCode = (code?.[1] ?? null) as keyof typeof IBAN_CODE_LENGTHS | null;

  return countryCode;
};

export const isValidIban = (
  input: string,
  onlyFromCountry?: keyof typeof IBAN_CODE_LENGTHS,
): boolean => {
  const iban = String(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // keep only alphanumeric characters
  const code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/); // match and capture (1) the country code, (2) the check digits, and (3) the rest

  if (!code) {
    return false;
  }

  const countryCode = getIbanCountry(input);

  if (onlyFromCountry && countryCode !== onlyFromCountry) {
    return false;
  }

  // check syntax and length
  if (!code || !countryCode || iban.length !== IBAN_CODE_LENGTHS[countryCode]) {
    return false;
  }
  // rearrange country code and check digits, and convert chars to ints
  const digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, (letter: string) =>
    (letter.charCodeAt(0) - 55).toString(),
  );
  // final check
  return mod97(digits) === 1;
};

const mod97 = (input: string): number => {
  let checksum = input.slice(0, 2);
  let fragment;
  for (let offset = 2; offset < input.length; offset += 7) {
    fragment = String(checksum) + input.substring(offset, offset + 7);
    checksum = (parseInt(fragment, 10) % 97).toString();
  }
  return Number(checksum);
};
