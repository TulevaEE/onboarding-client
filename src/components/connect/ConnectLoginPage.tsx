import React, { FC } from 'react';
import { Redirect, useLocation, useParams } from 'react-router-dom';

import LoginPage from '../login';
import { CancelConnecting } from './CancelConnecting';
import { connectPathOf } from './connectPath';

export const ConnectLoginPage: FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { state } = useLocation<{ from?: string } | undefined>();
  const requestPage = connectPathOf(requestId);

  if (state?.from !== requestPage) {
    return <Redirect to={requestPage} />;
  }

  return (
    <LoginPage>
      <CancelConnecting requestId={requestId} />
    </LoginPage>
  );
};
