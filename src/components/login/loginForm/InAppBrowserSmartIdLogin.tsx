import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';

import { QuietLinkButton } from './QuietLink';
import { PRIMARY_LOGIN_BUTTON_CLASS } from './loginButtonClasses';
import { PageAddress, WayOutOfTheInAppBrowser } from '../smartId/wayOutOfTheInAppBrowser';

type LoginLocationState = { from?: unknown } | undefined;

const pathThePersonWasSentTo = (from: unknown): URL | null => {
  if (typeof from !== 'string') {
    return null;
  }
  const sentTo = new URL(from, window.location.origin);
  return sentTo.origin === window.location.origin ? sentTo : null;
};

const useAddressOfThePageThePersonWasSentTo = (): PageAddress => {
  const { pathname, search, state } = useLocation<LoginLocationState>();
  const sentTo = pathThePersonWasSentTo(state?.from);
  return {
    host: window.location.host,
    pathAndQuery: sentTo ? `${sentTo.pathname}${search || sentTo.search}` : `${pathname}${search}`,
  };
};

type CopyOutcome = 'not copied' | 'copied' | 'refused';

const ContinueHere: React.FC<{ onContinueHere: () => void }> = ({ onContinueHere }) => (
  <QuietLinkButton onClick={onContinueHere}>
    <FormattedMessage id="login.smart.id.continue.here" />
  </QuietLinkButton>
);

const CopyLink: React.FC<{ address: string; onContinueHere: () => void }> = ({
  address,
  onContinueHere,
}) => {
  const [outcome, setOutcome] = useState<CopyOutcome>('not copied');
  const copy = () => {
    try {
      navigator.clipboard.writeText(address).then(
        () => setOutcome('copied'),
        () => setOutcome('refused'),
      );
    } catch (clipboardUnavailable) {
      setOutcome('refused');
    }
  };

  return (
    <div className="d-grid gap-2">
      <button type="button" className={PRIMARY_LOGIN_BUTTON_CLASS} onClick={copy}>
        <FormattedMessage id="login.smart.id.copy.link" />
      </button>
      <ContinueHere onContinueHere={onContinueHere} />
      <div role="status" className="text-pretty">
        {outcome === 'copied' && (
          <p className="m-0">
            <FormattedMessage id="login.smart.id.link.copied" />
          </p>
        )}
        {outcome === 'refused' && (
          <>
            <p className="m-0">
              <FormattedMessage id="login.smart.id.copy.link.by.hand" />
            </p>
            <p className="m-0 text-break user-select-all">{address}</p>
          </>
        )}
      </div>
    </div>
  );
};

const OpenInTheBrowser: React.FC<{ opensWith: 'link' | 'window'; address: string }> = ({
  opensWith,
  address,
}) =>
  opensWith === 'window' ? (
    <button
      type="button"
      className={PRIMARY_LOGIN_BUTTON_CLASS}
      onClick={() => window.open(address)}
    >
      <FormattedMessage id="login.smart.id.open.in.browser" />
    </button>
  ) : (
    <a className={PRIMARY_LOGIN_BUTTON_CLASS} href={address}>
      <FormattedMessage id="login.smart.id.open.in.browser" />
    </a>
  );

export const InAppBrowserSmartIdLogin: React.FC<{
  wayOut: WayOutOfTheInAppBrowser;
  onContinueHere: () => void;
}> = ({ wayOut: { opensWith, addressOf }, onContinueHere }) => {
  const address = addressOf(useAddressOfThePageThePersonWasSentTo());

  return (
    <>
      <p className="m-0 text-pretty">
        <FormattedMessage id="login.smart.id.in.app.browser" />
      </p>
      {opensWith === 'clipboard' ? (
        <CopyLink address={address} onContinueHere={onContinueHere} />
      ) : (
        <div className="d-grid gap-2">
          <OpenInTheBrowser opensWith={opensWith} address={address} />
          <ContinueHere onContinueHere={onContinueHere} />
        </div>
      )}
    </>
  );
};
