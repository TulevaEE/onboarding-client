const IBAN_CODE_LENGTHS = {
  EE: 20,
};

export const preProcessIban = (iban: string) => iban.trim().toUpperCase();

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

export const isValidIban = (input: string): boolean => {
  const iban = String(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // keep only alphanumeric characters
  const code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/); // match and capture (1) the country code, (2) the check digits, and (3) the rest

  if (!code) {
    return false;
  }

  const countryCode = getIbanCountry(input);

  if (countryCode !== 'EE') {
    return false;
  }

  // check syntax and length
  if (!code || iban.length !== IBAN_CODE_LENGTHS[countryCode]) {
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
