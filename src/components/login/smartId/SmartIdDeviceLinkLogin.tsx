import React, { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { Loader } from '../../common';
import { CancelButton } from '../../common/cancelButton/CancelButton';
import { FocusedParagraph } from '../../common/focusedParagraph/FocusedParagraph';
import { DeviceClass, deviceClass } from '../../common/deviceClass';
import { QuietLink } from '../loginForm/QuietLink';
import { useLoginLanguage } from '../loginLanguage';
import { useSmartIdQrCodeLink } from './useSmartIdQrCodeLink';
import { AutomaticRenewalAllowance } from './automaticRenewalAllowance';
import { SmartIdLoginFlow } from '../../common/apiModels';
import { opensTheSmartIdApp } from './opensTheSmartIdApp';
import { useStillOnThisPage } from './useStillOnThisPage';
import { IconBeforeLabel, SmartIdMarkIcon } from './icons';

const MODULES_IN_A_SMART_ID_DEVICE_LINK_QR_CODE = 53;
const QR_CODE_PIXELS_PER_MODULE: Record<DeviceClass, number> = {
  computer: 7,
  tablet: 10,
  phone: 10,
};

type SmartIdLoginStart = (language: string, flow: SmartIdLoginFlow, rememberMe: boolean) => void;

interface SmartIdDeviceLinkLoginProps {
  web2AppLink: string;
  rememberMe: boolean;
  qrCodeRequested: boolean;
  onCancel: () => void;
  onSmartIdLoginStart: SmartIdLoginStart;
  onExpire: () => void;
  automaticRenewals: AutomaticRenewalAllowance;
}

export const SmartIdDeviceLinkLogin: React.FC<SmartIdDeviceLinkLoginProps> = ({
  web2AppLink,
  rememberMe,
  qrCodeRequested,
  onCancel,
  onSmartIdLoginStart,
  onExpire,
  automaticRenewals,
}) => {
  if (opensTheSmartIdApp(qrCodeRequested)) {
    return <SmartIdAppLogin web2AppLink={web2AppLink} onCancel={onCancel} />;
  }
  const device = deviceClass();
  return (
    <SmartIdQrCodeLogin
      rememberMe={rememberMe}
      onCancel={onCancel}
      onSmartIdLoginStart={onSmartIdLoginStart}
      onExpire={onExpire}
      automaticRenewals={automaticRenewals}
      sizePixels={MODULES_IN_A_SMART_ID_DEVICE_LINK_QR_CODE * QR_CODE_PIXELS_PER_MODULE[device]}
    >
      {device === 'tablet' && (
        <QuietLink href={web2AppLink}>
          <FormattedMessage id="login.smart.id.open.app" />
        </QuietLink>
      )}
    </SmartIdQrCodeLogin>
  );
};

const SmartIdAppLogin: React.FC<{ web2AppLink: string; onCancel: () => void }> = ({
  web2AppLink,
  onCancel,
}) => {
  const stillOnThisPage = useStillOnThisPage();
  const appButton = useRef<HTMLAnchorElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (stillOnThisPage ? appButton : cancelButton).current?.focus();
  }, [stillOnThisPage]);

  return (
    <>
      <Loader className="align-middle" />
      <div className="d-grid gap-2 mt-4">
        {stillOnThisPage && (
          <a
            ref={appButton}
            className="btn btn-primary btn-lg text-wrap text-balance"
            href={web2AppLink}
          >
            <IconBeforeLabel icon={<SmartIdMarkIcon />}>
              <FormattedMessage id="login.smart.id.open.app" />
            </IconBeforeLabel>
          </a>
        )}
        <CancelButton ref={cancelButton} onCancel={onCancel} />
      </div>
    </>
  );
};

const SmartIdQrCodeLogin: React.FC<{
  rememberMe: boolean;
  onCancel: () => void;
  onSmartIdLoginStart: SmartIdLoginStart;
  onExpire: () => void;
  automaticRenewals: AutomaticRenewalAllowance;
  sizePixels: number;
  children: React.ReactNode;
}> = ({
  rememberMe,
  onCancel,
  onSmartIdLoginStart,
  onExpire,
  automaticRenewals,
  sizePixels,
  children,
}) => {
  const { formatMessage } = useIntl();
  const language = useLoginLanguage();
  const startNewSession = () => onSmartIdLoginStart(language, 'DEVICE_LINK', rememberMe);
  const { deviceLink, expired } = useSmartIdQrCodeLink(() => {
    if (!automaticRenewals.take()) {
      return false;
    }
    startNewSession();
    return true;
  }, onExpire);

  if (expired) {
    return (
      <>
        <FocusedParagraph className="m-0 mb-4 text-pretty">
          <FormattedMessage id="login.smart.id.qr.expired" />
        </FocusedParagraph>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-primary btn-lg text-wrap text-balance"
            onClick={startNewSession}
          >
            <FormattedMessage id="login.smart.id.qr.refresh" />
          </button>
          <CancelButton onCancel={onCancel} />
        </div>
      </>
    );
  }

  return (
    <>
      <FocusedParagraph className="m-0 mb-4 text-pretty">
        <FormattedMessage id="login.smart.id.qr.instructions" />
      </FocusedParagraph>
      <div
        className="d-flex align-items-center justify-content-center mx-auto"
        style={{ width: sizePixels, maxWidth: '100%', aspectRatio: '1' }}
      >
        {deviceLink ? (
          <QRCodeSVG
            value={deviceLink}
            size={sizePixels}
            level="L"
            bgColor="#ffffff"
            style={{ maxWidth: '100%', height: 'auto', aspectRatio: '1' }}
            role="img"
            aria-label={formatMessage({ id: 'login.smart.id.qr.instructions' })}
          />
        ) : (
          <Loader />
        )}
      </div>
      {children}
      <CancelButton onCancel={onCancel} className="mt-4" />
    </>
  );
};
