import { ActionOptions, ErrorCode } from '@web-eid/web-eid-library';
import config from 'react-global-configuration';

export type WebEidFailure = 'USER_CANCELLED' | 'EXTENSION_UNAVAILABLE' | 'FAILED';

const FAILURES_BY_CODE: Partial<Record<ErrorCode, WebEidFailure>> = {
  [ErrorCode.ERR_WEBEID_USER_CANCELLED]: 'USER_CANCELLED',
  [ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE]: 'EXTENSION_UNAVAILABLE',
};

const webEidErrorCode = (error: unknown): ErrorCode | null => {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && code.startsWith('ERR_WEBEID_') ? (code as ErrorCode) : null;
};

export const webEidFailureOf = (error: unknown): WebEidFailure | null => {
  const code = webEidErrorCode(error);
  return code ? FAILURES_BY_CODE[code] ?? 'FAILED' : null;
};

export const webEidOptions = (): ActionOptions => ({ lang: config.get('language') || 'et' });
