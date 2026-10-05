import React from 'react';
import { FormattedMessage } from 'react-intl';

export const CANCEL_BUTTON_CLASS = 'btn btn-outline-primary btn-lg w-100 text-wrap text-balance';

export const CancelButton = ({
  onCancel,
  className = '',
}: {
  onCancel: () => void;
  className?: string;
}) => (
  <button type="button" className={`${CANCEL_BUTTON_CLASS} ${className}`} onClick={onCancel}>
    <FormattedMessage id="login.stop" />
  </button>
);
