import React from 'react';

const MINIMUM_TOUCH_TARGET_PIXELS = 44;
const QUIET_LINK_CLASS = 'btn btn-link d-flex align-items-center justify-content-center';
const QUIET_LINK_STYLE = { minHeight: MINIMUM_TOUCH_TARGET_PIXELS };

export const QuietLinkButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled = false, children }) => (
  <button
    type="button"
    className={QUIET_LINK_CLASS}
    style={QUIET_LINK_STYLE}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export const QuietLink: React.FC<{
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ href, onClick, children }) => (
  <a className={QUIET_LINK_CLASS} style={QUIET_LINK_STYLE} href={href} onClick={onClick}>
    {children}
  </a>
);
