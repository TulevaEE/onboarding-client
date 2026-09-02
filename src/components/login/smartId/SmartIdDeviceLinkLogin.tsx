import React, { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { Loader } from '../../common';
import { isMobileDevice } from '../../common/isMobileDevice';
import { useLoginLanguage } from '../loginLanguage';
import { useSmartIdQrCodeLink } from './useSmartIdQrCodeLink';

const QR_CODE_SIZE_PIXELS = 256;

interface SmartIdDeviceLinkLoginProps {
  web2AppLink: string;
  onCancel: () => void;
  onSmartIdLoginStart: (language: string) => void;
}

export const SmartIdDeviceLinkLogin: React.FC<SmartIdDeviceLinkLoginProps> = ({
  web2AppLink,
  onCancel,
  onSmartIdLoginStart,
}) =>
  isMobileDevice() ? (
    <SmartIdAppLogin web2AppLink={web2AppLink} onCancel={onCancel} />
  ) : (
    <SmartIdQrCodeLogin onCancel={onCancel} onSmartIdLoginStart={onSmartIdLoginStart} />
  );

const SmartIdAppLogin: React.FC<{ web2AppLink: string; onCancel: () => void }> = ({
  web2AppLink,
  onCancel,
}) => {
  useEffect(() => {
    window.location.assign(web2AppLink);
  }, [web2AppLink]);

  return (
    <SmartIdLoginCard>
      <p className="m-0 mb-4">
        <FormattedMessage id="login.smart.id.mobile.instructions" />
      </p>
      <Loader className="align-middle" />
      <div className="d-grid mt-4">
        <a className="btn btn-primary btn-lg" href={web2AppLink}>
          <FormattedMessage id="login.smart.id.open.app" />
        </a>
      </div>
      <CancelButton onCancel={onCancel} />
    </SmartIdLoginCard>
  );
};

const SmartIdQrCodeLogin: React.FC<{
  onCancel: () => void;
  onSmartIdLoginStart: (language: string) => void;
}> = ({ onCancel, onSmartIdLoginStart }) => {
  const { formatMessage } = useIntl();
  const language = useLoginLanguage();
  const { deviceLink, expired } = useSmartIdQrCodeLink();

  if (expired) {
    return (
      <SmartIdLoginCard>
        <p className="m-0 mb-4">
          <FormattedMessage id="login.smart.id.qr.expired" />
        </p>
        <div className="d-grid">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onSmartIdLoginStart(language)}
          >
            <FormattedMessage id="login.smart.id.qr.refresh" />
          </button>
        </div>
        <CancelButton onCancel={onCancel} />
      </SmartIdLoginCard>
    );
  }

  return (
    <SmartIdLoginCard>
      <p className="m-0 mb-4">
        <FormattedMessage id="login.smart.id.qr.instructions" />
      </p>
      {deviceLink ? (
        <QRCodeSVG
          value={deviceLink}
          size={QR_CODE_SIZE_PIXELS}
          level="L"
          bgColor="#ffffff"
          role="img"
          aria-label={formatMessage({ id: 'login.smart.id.qr.instructions' })}
        />
      ) : (
        <Loader className="align-middle" />
      )}
      <CancelButton onCancel={onCancel} />
    </SmartIdLoginCard>
  );
};

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
