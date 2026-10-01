const TYPING_SEPARATORS = /[\s\-.()]/g;
const ESTONIAN_LOCAL_NUMBER = /^\d{7,8}$/;
const ESTONIAN_MOBILE_NUMBER = /^\+372\d{7,8}$/;
const DIALLED_ABROAD = /^(\+|00)\d{3,}$/;
const ESTONIAN_COUNTRY_CODE = '372';

export type MobileIdPhoneNumber = { phoneNumber: string } | { problem: 'NOT_ESTONIAN' | 'INVALID' };

const withCountryCode = (compact: string): string => {
  if (compact.startsWith('+')) {
    return compact.substring(1);
  }
  if (ESTONIAN_LOCAL_NUMBER.test(compact)) {
    return `${ESTONIAN_COUNTRY_CODE}${compact}`;
  }
  if (compact.startsWith('00')) {
    return compact.substring(2);
  }
  return compact;
};

const isForeign = (compact: string, digitsAfterPrefix: string): boolean =>
  DIALLED_ABROAD.test(compact) && !digitsAfterPrefix.startsWith(ESTONIAN_COUNTRY_CODE);

export const normalizeMobileIdPhoneNumber = (typed: string): MobileIdPhoneNumber => {
  const compact = typed.replace(TYPING_SEPARATORS, '');
  const digitsAfterPrefix = withCountryCode(compact);
  const canonical = `+${digitsAfterPrefix}`;
  if (ESTONIAN_MOBILE_NUMBER.test(canonical)) {
    return { phoneNumber: canonical };
  }
  return { problem: isForeign(compact, digitsAfterPrefix) ? 'NOT_ESTONIAN' : 'INVALID' };
};
