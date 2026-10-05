import React from 'react';
import { FormattedMessage } from 'react-intl';

const MINIMUM_TOUCH_TARGET_PIXELS = 44;

export const NotYouButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    className="btn btn-link d-flex align-items-center justify-content-center"
    style={{ minHeight: MINIMUM_TOUCH_TARGET_PIXELS }}
    onClick={onClick}
  >
    <FormattedMessage id="login.not.you" />
  </button>
);
