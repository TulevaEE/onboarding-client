import React from 'react';

const MINIMUM_TOUCH_TARGET_PIXELS = 44;
const QUIET_LINK_CLASS = 'btn btn-link d-flex align-items-center justify-content-center';
const QUIET_LINK_STYLE = { minHeight: MINIMUM_TOUCH_TARGET_PIXELS };

export const QuietLinkButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button type="button" className={QUIET_LINK_CLASS} style={QUIET_LINK_STYLE} onClick={onClick}>
    {children}
  </button>
);

export const QuietLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a className={QUIET_LINK_CLASS} style={QUIET_LINK_STYLE} href={href}>
    {children}
  </a>
);
