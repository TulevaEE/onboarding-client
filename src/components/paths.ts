export const ACCOUNT_PATH = '/account';
export const AML_PATH = '/aml';

export const isDeepLink = (from?: string | null): from is string =>
  !!from && from !== '/' && from !== ACCOUNT_PATH;
