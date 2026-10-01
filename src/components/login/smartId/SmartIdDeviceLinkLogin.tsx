import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { Loader } from '../../common';
import { isMobileDevice } from '../../common/isMobileDevice';
import { useLoginLanguage } from '../loginLanguage';
import { useSmartIdQrCodeLink } from './useSmartIdQrCodeLink';
import { AutomaticRenewalAllowance } from './automaticRenewalAllowance';

const QR_CODE_SIZE_PIXELS = 256;

interface SmartIdDeviceLinkLoginProps {
  web2AppLink: string;
  onCancel: () => void;
  onSmartIdLoginStart: (language: string) => void;
  automaticRenewals: AutomaticRenewalAllowance;
}

export const SmartIdDeviceLinkLogin: React.FC<SmartIdDeviceLinkLoginProps> = ({
  web2AppLink,
  onCancel,
  onSmartIdLoginStart,
  automaticRenewals,
}) =>
  isMobileDevice() ? (
    <SmartIdAppLogin web2AppLink={web2AppLink} onCancel={onCancel} />
  ) : (
    <SmartIdQrCodeLogin
      onCancel={onCancel}
      onSmartIdLoginStart={onSmartIdLoginStart}
      automaticRenewals={automaticRenewals}
    />
  );

const SmartIdAppLogin: React.FC<{ web2AppLink: string; onCancel: () => void }> = ({
  web2AppLink,
  onCancel,
}) => (
  <SmartIdLoginCard>
    <p className="m-0 mb-4 text-pretty">
      <FormattedMessage id="login.smart.id.mobile.instructions" />
    </p>
    <Loader className="align-middle" />
    <ConfirmationHint className="mt-3" />
    <div className="d-grid gap-2 mt-4">
      <a className="btn btn-primary btn-lg" href={web2AppLink}>
        <FormattedMessage id="login.smart.id.open.app" />
      </a>
      <StackedCancelButton onCancel={onCancel} />
    </div>
  </SmartIdLoginCard>
);

const SmartIdQrCodeLogin: React.FC<{
  onCancel: () => void;
  onSmartIdLoginStart: (language: string) => void;
  automaticRenewals: AutomaticRenewalAllowance;
}> = ({ onCancel, onSmartIdLoginStart, automaticRenewals }) => {
  const { formatMessage } = useIntl();
  const language = useLoginLanguage();
  const { deviceLink, expired } = useSmartIdQrCodeLink(() => {
    if (!automaticRenewals.take()) {
      return false;
    }
    onSmartIdLoginStart(language);
    return true;
  });

  if (expired) {
    return (
      <SmartIdLoginCard>
        <p className="m-0 mb-4 text-pretty">
          <FormattedMessage id="login.smart.id.qr.expired" />
        </p>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onSmartIdLoginStart(language)}
          >
            <FormattedMessage id="login.smart.id.qr.refresh" />
          </button>
          <StackedCancelButton onCancel={onCancel} />
        </div>
      </SmartIdLoginCard>
    );
  }

  return (
    <SmartIdLoginCard>
      <p className="m-0 mb-4 text-pretty">
        <FormattedMessage id="login.smart.id.qr.instructions" />
      </p>
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
        <Loader className="align-middle" />
      )}
      <ConfirmationHint className="mt-3" />
      <CancelButton onCancel={onCancel} />
    </SmartIdLoginCard>
  );
};

const ConfirmationHint: React.FC<{ className: string }> = ({ className }) => (
  <p className={`m-0 ${className} small text-body-secondary text-pretty`}>
    <FormattedMessage id="login.smart.id.confirm.hint" />
  </p>
);

const SmartIdLoginCard: React.FC = ({ children }) => (
  <div className="bg-white shadow-sm rounded-3 p-5 text-center">{children}</div>
);

const CancelButton: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <div>
    <button type="button" className="btn btn-outline-primary mt-4" onClick={onCancel}>
      <FormattedMessage id="login.stop" />
    </button>
  </div>
);

const StackedCancelButton: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <button type="button" className="btn btn-outline-primary btn-lg" onClick={onCancel}>
    <FormattedMessage id="login.stop" />
  </button>
);
