import React, { FC, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { ErrorAlert, Loader } from '../common';
import { getAuthentication } from '../common/authenticationManager';
import { cancelMobileAuthentication } from '../login/actions';
import { loginPath } from '../login/constants';
import { LoginFrame } from '../login/LoginFrame';
import {
  asksForAFreshLogin,
  useApproveConnectRequest,
  useConnectRequest,
  useDenyConnectRequest,
  requestIsGone,
} from './connect.api';
import {
  hasALoginThatCannotCountFor,
  hasFreshLoginFor,
  stopSteeringTheCallbackTo,
  startFreshLoginFor,
} from './freshLogin';
import { ConnectScope, describedScopesOf, ScopeDescription } from './ScopeDescription';

export const ConnectPage: FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  return <ConnectRequestPage key={requestId} requestId={requestId} />;
};

const ConnectRequestPage: FC<{ requestId: string }> = ({ requestId }) => {
  const request = useConnectRequest(requestId);
  const approve = useApproveConnectRequest(requestId);
  const deny = useDenyConnectRequest(requestId);
  const [arrivedWithAFreshLogin] = useState(() => hasFreshLoginFor(requestId));
  const [loginCannotCount, setLoginCannotCount] = useState(() =>
    hasALoginThatCannotCountFor(requestId),
  );
  const [sessionEnded, setSessionEnded] = useState(false);
  const answers = [approve, deny];
  const loginRequired = answers.some(({ error }) => asksForAFreshLogin(error));
  const describedScopes = request.data && describedScopesOf(request.data.scopes);
  const linkDoesNotWork =
    describedScopes === null || [request, ...answers].some(({ error }) => requestIsGone(error));
  const answerFailed = answers.some(({ isError }) => isError) && !loginRequired;
  const answered = answers.some(({ isLoading, isSuccess }) => isLoading || isSuccess);

  if (linkDoesNotWork) {
    return (
      <ConnectFrame>
        <LinkDoesNotWork />
      </ConnectFrame>
    );
  }

  if (request.isError) {
    return <SomethingWentWrong onRetry={() => request.refetch()} />;
  }

  if (!request.data || !describedScopes) {
    return (
      <ConnectFrame>
        <Loader className="align-middle" />
      </ConnectFrame>
    );
  }

  if (!arrivedWithAFreshLogin && loginCannotCount) {
    return <SomethingWentWrong onRetry={() => setLoginCannotCount(false)} />;
  }

  if (!arrivedWithAFreshLogin || loginRequired || sessionEnded) {
    return (
      <FreshLogin
        requestId={requestId}
        createdAt={request.data.createdAt}
        expiresAt={request.data.expiresAt}
      />
    );
  }

  return (
    <ConnectFrame>
      <Consent
        requestId={requestId}
        clientName={request.data.clientName}
        scopes={describedScopes}
        answered={answered}
        answerFailed={answerFailed}
        onAllow={() =>
          getAuthentication().isAuthenticated() ? approve.mutate() : setSessionEnded(true)
        }
        onDeny={() => deny.mutate()}
      />
    </ConnectFrame>
  );
};

const LinkDoesNotWork: FC = () => (
  <>
    <h1 className="m-0 h2 text-balance">
      <FormattedMessage id="connect.error.title" />
    </h1>
    <p className="m-0 mt-3 text-body-secondary text-pretty">
      <FormattedMessage id="connect.error.description" />
    </p>
  </>
);

const SomethingWentWrong: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ConnectFrame>
    <ErrorAlert>
      <FormattedMessage id="connect.error.generic" />
    </ErrorAlert>
    <div className="d-grid">
      <button type="button" className="btn btn-primary btn-lg" onClick={onRetry}>
        <FormattedMessage id="connect.retry" />
      </button>
    </div>
  </ConnectFrame>
);

const FreshLogin: FC<{ requestId: string; createdAt: string; expiresAt: string }> = ({
  requestId,
  createdAt,
  expiresAt,
}) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [recordRefused, setRecordRefused] = useState(false);

  const startTheLogin = useCallback(() => {
    dispatch(cancelMobileAuthentication());
    const recordKept = startFreshLoginFor({ requestId, createdAt, expiresAt }, dispatch);
    setRecordRefused(!recordKept);
    if (recordKept) {
      history.replace({ pathname: loginPath, state: { from: pathname } });
    }
  }, [requestId, createdAt, expiresAt, dispatch, history, pathname]);

  useEffect(startTheLogin, [startTheLogin]);

  return recordRefused ? <SomethingWentWrong onRetry={startTheLogin} /> : null;
};

const Consent: FC<{
  requestId: string;
  clientName: string;
  scopes: ConnectScope[];
  answered: boolean;
  answerFailed: boolean;
  onAllow: () => void;
  onDeny: () => void;
}> = ({ requestId, clientName, scopes, answered, answerFailed, onAllow, onDeny }) => {
  useEffect(() => {
    stopSteeringTheCallbackTo(requestId);
  }, [requestId]);

  return (
    <>
      <h1 className="m-0 h2 text-balance">
        <FormattedMessage id="connect.consent.title" values={{ clientName }} />
      </h1>
      <ul className="list-unstyled m-0 mt-4 d-flex flex-column gap-2 fs-5">
        {scopes.map((scope) => (
          <li key={scope}>
            <ScopeDescription scope={scope} />
          </li>
        ))}
      </ul>
      <p className="m-0 mt-4 text-body-secondary text-pretty">
        <FormattedMessage id="connect.consent.duration" />
      </p>
      <p className="m-0 mt-2 text-body-secondary text-pretty">
        <FormattedMessage id="connect.consent.revocable" />
      </p>
      {answerFailed && (
        <ErrorAlert className="mt-4 mb-0">
          <FormattedMessage id="connect.error.generic" />
        </ErrorAlert>
      )}
      <div className="d-grid gap-2 mt-5">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={answered}
          onClick={onAllow}
        >
          <FormattedMessage id="connect.consent.allow" />
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-lg"
          disabled={answered}
          onClick={onDeny}
        >
          <FormattedMessage id="connect.consent.deny" />
        </button>
      </div>
    </>
  );
};

const ConnectFrame: FC = ({ children }) => (
  <LoginFrame>
    <div className="bg-white shadow-sm rounded-3 p-4 p-sm-5 text-center">{children}</div>
  </LoginFrame>
);
