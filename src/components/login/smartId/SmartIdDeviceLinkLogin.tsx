import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { Loader } from '../../common';
import { isMobileDevice } from '../../common/isMobileDevice';
import { useLoginLanguage } from '../loginLanguage';
import { useSmartIdQrCodeLink } from './useSmartIdQrCodeLink';
import { AutomaticRenewalAllowance } from './automaticRenewalAllowance';
import { SmartIdLoginFlow } from '../../common/apiModels';

const MODULES_IN_A_SMART_ID_DEVICE_LINK_QR_CODE = 53;
const PIXELS_PER_MODULE = 7;
const QR_CODE_SIZE_PIXELS = MODULES_IN_A_SMART_ID_DEVICE_LINK_QR_CODE * PIXELS_PER_MODULE;

type SmartIdLoginStart = (language: string, flow: SmartIdLoginFlow, rememberMe: boolean) => void;

interface SmartIdDeviceLinkLoginProps {
  web2AppLink: string;
  rememberMe: boolean;
  onCancel: () => void;
  onSmartIdLoginStart: SmartIdLoginStart;
  onExpire: () => void;
  automaticRenewals: AutomaticRenewalAllowance;
}

export const SmartIdDeviceLinkLogin: React.FC<SmartIdDeviceLinkLoginProps> = ({
  web2AppLink,
  rememberMe,
  onCancel,
  onSmartIdLoginStart,
  onExpire,
  automaticRenewals,
}) =>
  isMobileDevice() ? (
    <SmartIdAppLogin web2AppLink={web2AppLink} onCancel={onCancel} />
  ) : (
    <SmartIdQrCodeLogin
      rememberMe={rememberMe}
      onCancel={onCancel}
      onSmartIdLoginStart={onSmartIdLoginStart}
      onExpire={onExpire}
      automaticRenewals={automaticRenewals}
    />
  );

const SmartIdAppLogin: React.FC<{ web2AppLink: string; onCancel: () => void }> = ({
  web2AppLink,
  onCancel,
}) => (
  <>
    <p className="m-0 mb-4 text-pretty">
      <FormattedMessage id="login.smart.id.mobile.instructions" />
    </p>
    <Loader className="align-middle" />
    <ConfirmationHint className="mt-3" />
    <div className="d-grid gap-2 mt-4">
      <a className="btn btn-primary btn-lg text-wrap text-balance" href={web2AppLink}>
        <FormattedMessage id="login.smart.id.open.app" />
      </a>
      <StackedCancelButton onCancel={onCancel} />
    </div>
  </>
);

const SmartIdQrCodeLogin: React.FC<{
  rememberMe: boolean;
  onCancel: () => void;
  onSmartIdLoginStart: SmartIdLoginStart;
  onExpire: () => void;
  automaticRenewals: AutomaticRenewalAllowance;
}> = ({ rememberMe, onCancel, onSmartIdLoginStart, onExpire, automaticRenewals }) => {
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
        <p className="m-0 mb-4 text-pretty">
          <FormattedMessage id="login.smart.id.qr.expired" />
        </p>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-primary btn-lg text-wrap text-balance"
            onClick={startNewSession}
          >
            <FormattedMessage id="login.smart.id.qr.refresh" />
          </button>
          <StackedCancelButton onCancel={onCancel} />
        </div>
      </>
    );
  }

  return (
    <>
      <p className="m-0 mb-4 text-pretty">
        <FormattedMessage id="login.smart.id.qr.instructions" />
      </p>
      <div
        className="d-flex align-items-center justify-content-center mx-auto"
        style={{ width: QR_CODE_SIZE_PIXELS, maxWidth: '100%', aspectRatio: '1' }}
      >
        {deviceLink ? (
          <QRCodeSVG
            value={deviceLink}
            size={QR_CODE_SIZE_PIXELS}
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
      <CancelButton onCancel={onCancel} />
    </>
  );
};

const ConfirmationHint: React.FC<{ className: string }> = ({ className }) => (
  <p className={`m-0 ${className} small text-body-secondary text-pretty`}>
    <FormattedMessage id="login.smart.id.confirm.hint" />
  </p>
);

const CancelButton: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <div>
    <button type="button" className="btn btn-outline-primary mt-4" onClick={onCancel}>
      <FormattedMessage id="login.stop" />
    </button>
  </div>
);

const StackedCancelButton: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <button
    type="button"
    className="btn btn-outline-primary btn-lg text-wrap text-balance"
    onClick={onCancel}
  >
    <FormattedMessage id="login.stop" />
  </button>
);
