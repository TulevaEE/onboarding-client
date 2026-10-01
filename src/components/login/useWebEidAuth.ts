import { useMutation } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';

import { authenticateWithIdCardWebEid } from '../common/api';
import { WebEidFailure, webEidFailureOf, webEidOptions } from '../common/webEid';
import { loginLanding } from './loginLanding';
import {
  ID_CARD_LOGIN_START_FAILED_ERROR,
  WEB_EID_EXTENSION_UNAVAILABLE,
  WEB_EID_TIMEOUT,
  WEB_EID_USER_CANCELLED,
} from '../common/errorAlert/ErrorAlert';

const LOGIN_ERRORS: Record<WebEidFailure, string> = {
  USER_CANCELLED: WEB_EID_USER_CANCELLED,
  TIMEOUT: WEB_EID_TIMEOUT,
  EXTENSION_UNAVAILABLE: WEB_EID_EXTENSION_UNAVAILABLE,
  FAILED: ID_CARD_LOGIN_START_FAILED_ERROR,
};

function mapWebEidError(error: unknown): string {
  const webEidFailure = webEidFailureOf(error);
  return webEidFailure ? LOGIN_ERRORS[webEidFailure] : ID_CARD_LOGIN_START_FAILED_ERROR;
}

export function useWebEidAuth() {
  const history = useHistory();
  const location = useLocation<{ from?: string } | undefined>();

  const mutation = useMutation({
    mutationFn: () => authenticateWithIdCardWebEid(webEidOptions()),
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
