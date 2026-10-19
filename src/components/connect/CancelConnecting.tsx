import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { ErrorAlert } from '../common';
import { QuietLinkButton } from '../login/loginForm/QuietLink';
import { requestIsGone, useDenyConnectRequest } from './connect.api';
import { connectPathOf } from './connectPath';

export const CancelConnecting: FC<{ requestId: string }> = ({ requestId }) => {
  const history = useHistory();
  const deny = useDenyConnectRequest(requestId);
  const showThatTheRequestIsGone = (error: unknown) => {
    if (requestIsGone(error)) {
      history.replace(connectPathOf(requestId));
    }
  };

  return (
    <>
      {deny.isError && (
        <ErrorAlert className="mt-3 mb-0 text-center">
          <FormattedMessage id="connect.error.generic" />
        </ErrorAlert>
      )}
      <div className="mt-3 d-flex justify-content-center">
        <QuietLinkButton
          onClick={() => deny.mutate(undefined, { onError: showThatTheRequestIsGone })}
          disabled={deny.isLoading || deny.isSuccess}
        >
          <FormattedMessage id="common.cancel" />
        </QuietLinkButton>
      </div>
    </>
  );
};
