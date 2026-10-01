import { ActionOptions, ErrorCode, status } from '@web-eid/web-eid-library';
import config from 'react-global-configuration';

export type WebEidSetupFailure = 'EXTENSION_MISSING' | 'ID_SOFTWARE_MISSING' | 'UPDATE_REQUIRED';

export type WebEidFailure = 'USER_CANCELLED' | 'TIMEOUT' | WebEidSetupFailure | 'FAILED';

const FAILURES_BY_CODE: Partial<Record<ErrorCode, WebEidFailure>> = {
  [ErrorCode.ERR_WEBEID_USER_CANCELLED]: 'USER_CANCELLED',
  [ErrorCode.ERR_WEBEID_USER_TIMEOUT]: 'TIMEOUT',
  [ErrorCode.ERR_WEBEID_ACTION_TIMEOUT]: 'TIMEOUT',
};

const SETUP_FAILURES_BY_CODE: Partial<Record<ErrorCode, WebEidSetupFailure>> = {
  [ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE]: 'EXTENSION_MISSING',
  [ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE]: 'ID_SOFTWARE_MISSING',
  [ErrorCode.ERR_WEBEID_VERSION_MISMATCH]: 'UPDATE_REQUIRED',
};

class DiagnosedWebEidFailure extends Error {
  constructor(readonly failure: WebEidFailure) {
    super(`Web eID failure diagnosed: failure=${failure}`);
    this.name = 'DiagnosedWebEidFailure';
  }
}

const webEidErrorCode = (error: unknown): ErrorCode | null => {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && code.startsWith('ERR_WEBEID_') ? (code as ErrorCode) : null;
};

const setupFailureOf = (error: unknown): WebEidSetupFailure | null => {
  const code = webEidErrorCode(error);
  return (code && SETUP_FAILURES_BY_CODE[code]) ?? null;
};

export const webEidFailureOf = (error: unknown): WebEidFailure | null => {
  if (error instanceof DiagnosedWebEidFailure) {
    return error.failure;
  }
  const code = webEidErrorCode(error);
  return code ? FAILURES_BY_CODE[code] ?? 'FAILED' : null;
};

const failureReportedByStatus = async (): Promise<WebEidFailure> => {
  try {
    await status();
    return 'FAILED';
  } catch (statusError) {
    return setupFailureOf(statusError) ?? 'FAILED';
  }
};

export const withWebEidDiagnosis = async <T>(action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (setupFailureOf(error)) {
      throw new DiagnosedWebEidFailure(await failureReportedByStatus());
    }
    throw error;
  }
};

export const webEidOptions = (): ActionOptions => ({ lang: config.get('language') || 'et' });
