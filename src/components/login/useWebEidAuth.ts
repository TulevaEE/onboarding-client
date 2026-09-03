import { useMutation } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';

import { authenticateWithIdCardWebEid } from '../common/api';
import {
  WebEidFailure,
  webEidFailureOf,
  webEidOptions,
  withWebEidDiagnosis,
} from '../common/webEid';
import { getGlobalErrorCode } from '../common/errorMessage/ErrorMessage';
import { loginLanding } from './loginLanding';
import {
  ID_CARD_LOGIN_START_FAILED_ERROR,
  WEB_EID_TIMEOUT,
  WEB_EID_USER_CANCELLED,
} from '../common/errorAlert/ErrorAlert';

const LOGIN_ERRORS: Record<WebEidFailure, string> = {
  USER_CANCELLED: WEB_EID_USER_CANCELLED,
  TIMEOUT: WEB_EID_TIMEOUT,
  EXTENSION_MISSING: 'web.eid.extension.missing',
  ID_SOFTWARE_MISSING: 'web.eid.id.software.missing',
  UPDATE_REQUIRED: 'web.eid.update.required',
  FAILED: ID_CARD_LOGIN_START_FAILED_ERROR,
};

function mapWebEidError(error: unknown): string {
  const webEidFailure = webEidFailureOf(error);
  if (webEidFailure) {
    return LOGIN_ERRORS[webEidFailure];
  }
  return (
    getGlobalErrorCode((error as { body?: unknown })?.body) ?? ID_CARD_LOGIN_START_FAILED_ERROR
  );
}

export function useWebEidAuth() {
  const history = useHistory();
  const location = useLocation<{ from?: string } | undefined>();

  const mutation = useMutation({
    mutationFn: () => withWebEidDiagnosis(() => authenticateWithIdCardWebEid(webEidOptions())),
    onSuccess: () => {
      const from = location.state?.from;
      history.replace(loginLanding(from));
    },
  });

  return {
    authenticate: mutation.mutate,
    isLoading: mutation.isLoading,
    error: mutation.error ? mapWebEidError(mutation.error) : null,
    reset: mutation.reset,
  };
}
