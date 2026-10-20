import React, { FC, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ErrorAlert } from '../../common';
import { formatDateYear } from '../../common/dateFormatter';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { isDescribed, ScopeDescription } from '../../connect/ScopeDescription';
import { TranslationKey } from '../../translations';
import { SecuritySection } from '../SecuritySection';
import { ConnectedApp, useConnectedApps, useRevokeConnectedApp } from './connectedApps.api';

const focusWhenShown = (element: HTMLElement | null) => element?.focus();

export const ConnectedAppsSection: FC = () => (
  <SecuritySection
    id="connected-apps"
    title="security.connectedApps.title"
    description="security.connectedApps.description"
  >
    <ConnectedAppsOrState />
  </SecuritySection>
);

const ConnectedAppsOrState: FC = () => {
  const { data: apps, isError, refetch } = useConnectedApps();
  const [revokedApp, setRevokedApp] = useState<ConnectedApp | null>(null);

  if (!apps) {
    return isError ? <CouldNotLoad onRetry={() => refetch()} /> : <Loading />;
  }

  return (
    <>
      {revokedApp && <Revoked key={revokedApp.id} clientName={revokedApp.clientName} />}
      {apps.length === 0 ? (
        <p className="m-0">
          <FormattedMessage id="security.connectedApps.none" />
        </p>
      ) : (
        <ul className="list-unstyled m-0 d-flex flex-column gap-3">
          {apps.map((app) => (
            <ConnectedAppRow key={app.id} app={app} onRevoked={setRevokedApp} />
          ))}
        </ul>
      )}
    </>
  );
};

const Loading: FC = () => {
  const { formatMessage } = useIntl();
  return (
    <div role="status" aria-label={formatMessage({ id: 'common.loading' })}>
      <Shimmer height={168} />
    </div>
  );
};

const CouldNotLoad: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorAlert className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-0">
    <span>
      <FormattedMessage id="security.connectedApps.loadFailed" />
    </span>
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
      <FormattedMessage id="security.retry" />
    </button>
  </ErrorAlert>
);

const Revoked: FC<{ clientName: string }> = ({ clientName }) => (
  <div ref={focusWhenShown} tabIndex={-1} className="alert alert-success text-pretty" role="status">
    <FormattedMessage id="security.connectedApps.revoked" values={{ clientName }} />
  </div>
);

const ConnectedAppRow: FC<{ app: ConnectedApp; onRevoked: (app: ConnectedApp) => void }> = ({
  app,
  onRevoked,
}) => {
  const revoke = useRevokeConnectedApp(onRevoked);
  const [confirming, setConfirming] = useState(false);
  const [askedBefore, setAskedBefore] = useState(false);
  const nameId = `connected-app-${app.id}`;

  const ask = () => {
    setConfirming(true);
    setAskedBefore(true);
  };

  const keepTheAccess = () => {
    revoke.reset();
    setConfirming(false);
  };

  return (
    <li className="card p-4" aria-labelledby={nameId}>
      <div className="d-flex justify-content-between align-items-start gap-3">
        <h3 id={nameId} className="h5 m-0 text-break">
          {app.clientName}
        </h3>
        {!confirming && (
          <button
            ref={askedBefore ? focusWhenShown : undefined}
            type="button"
            className="btn btn-sm btn-outline-primary text-nowrap"
            onClick={ask}
          >
            <FormattedMessage id="security.connectedApps.revoke" />
          </button>
        )}
      </div>
      <WhatItCanSee app={app} />
      <dl className="m-0 mt-3 d-flex flex-wrap column-gap-4 row-gap-2">
        <AccessDate term="security.connectedApps.connectedAt" date={app.connectedAt} />
        {app.lastUsedAt && (
          <AccessDate term="security.connectedApps.lastUsedAt" date={app.lastUsedAt} />
        )}
        <AccessDate term="security.connectedApps.expiresAt" date={app.expiresAt} />
      </dl>
      {confirming && (
        <RevokeConfirmation
          clientName={app.clientName}
          revoking={revoke.isLoading}
          failed={revoke.isError}
          onConfirm={() => revoke.mutate(app)}
          onCancel={keepTheAccess}
        />
      )}
    </li>
  );
};

const WhatItCanSee: FC<{ app: ConnectedApp }> = ({ app }) => {
  const labelId = `connected-app-${app.id}-scopes`;
  return (
    <>
      <p id={labelId} className="m-0 mt-3 small text-body-secondary">
        <FormattedMessage id="security.connectedApps.canSee" />
      </p>
      <ul aria-labelledby={labelId} className="list-unstyled m-0">
        {app.scopes.map((scope) => (
          <li key={scope}>{isDescribed(scope) ? <ScopeDescription scope={scope} /> : scope}</li>
        ))}
      </ul>
    </>
  );
};

const AccessDate: FC<{ term: TranslationKey; date: string }> = ({ term, date }) => (
  <div>
    <dt className="small fw-normal text-body-secondary">
      <FormattedMessage id={term} />
    </dt>
    <dd className="m-0">{formatDateYear(date)}</dd>
  </div>
);

const RevokeConfirmation: FC<{
  clientName: string;
  revoking: boolean;
  failed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ clientName, revoking, failed, onConfirm, onCancel }) => (
  <div className="mt-4 pt-4 border-top">
    <p ref={focusWhenShown} tabIndex={-1} className="m-0 text-pretty">
      <FormattedMessage id="security.connectedApps.revokeWarning" values={{ clientName }} />
    </p>
    {failed && (
      <ErrorAlert className="mt-3 mb-0">
        <span ref={focusWhenShown} tabIndex={-1}>
          <FormattedMessage id="security.connectedApps.revokeFailed" />
        </span>
      </ErrorAlert>
    )}
    <div className="d-flex flex-column flex-sm-row-reverse gap-2 mt-3">
      <button type="button" className="btn btn-danger" disabled={revoking} onClick={onConfirm}>
        <FormattedMessage id="security.connectedApps.revoke" />
      </button>
      <button type="button" className="btn btn-light" disabled={revoking} onClick={onCancel}>
        <FormattedMessage id="security.connectedApps.keep" />
      </button>
    </div>
  </div>
);
