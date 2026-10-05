import React, { forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';

export const CANCEL_BUTTON_CLASS = 'btn btn-outline-primary btn-lg w-100 text-wrap text-balance';

export const CancelButton = forwardRef<
  HTMLButtonElement,
  { onCancel: () => void; className?: string }
>(({ onCancel, className = '' }, ref) => (
  <button
    ref={ref}
    type="button"
    className={`${CANCEL_BUTTON_CLASS} ${className}`}
    onClick={onCancel}
  >
    <FormattedMessage id="login.stop" />
  </button>
));
