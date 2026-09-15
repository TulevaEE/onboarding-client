import { useMutation } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import config from 'react-global-configuration';
import { ErrorCode } from '@web-eid/web-eid-library';

import { authenticateWithIdCardWebEid } from '../common/api';
import { ACCOUNT_PATH, isDeepLink } from '../paths';
import {
  ID_CARD_LOGIN_START_FAILED_ERROR,
  WEB_EID_EXTENSION_UNAVAILABLE,
  WEB_EID_USER_CANCELLED,
} from '../common/errorAlert/ErrorAlert';

function mapWebEidError(error: unknown): string {
  const webEidError = error as { code?: string };
  if (webEidError?.code === ErrorCode.ERR_WEBEID_USER_CANCELLED) {
    return WEB_EID_USER_CANCELLED;
  }
  if (webEidError?.code === ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE) {
    return WEB_EID_EXTENSION_UNAVAILABLE;
  }
  return ID_CARD_LOGIN_START_FAILED_ERROR;
}

export function useWebEidAuth() {
  const history = useHistory();
  const location = useLocation<{ from?: string } | undefined>();

  const mutation = useMutation({
    mutationFn: () => authenticateWithIdCardWebEid(config.get('language') || 'et'),
    onSuccess: () => {
      const from = location.state?.from;
      if (isDeepLink(from)) {
        history.push(from);
      } else {
        history.push(ACCOUNT_PATH, { justLoggedIn: true });
      }
    },
  });

  return {
    authenticate: mutation.mutate,
    isLoading: mutation.isLoading,
    error: mutation.error ? mapWebEidError(mutation.error) : null,
    reset: mutation.reset,
  };
}
