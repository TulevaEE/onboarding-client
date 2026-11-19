import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

const NO_BREAK_BEFORE_ICON = ' ';

const NewTabIcon = () => (
  <svg
    className="external-link-icon"
    role="img"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

export const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
    {NO_BREAK_BEFORE_ICON}
    <NewTabIcon />
    <span className="visually-hidden">
      {' '}
      <FormattedMessage id="futureMe.help.newWindow" />
    </span>
  </a>
);

export const externalLink = (href: string) => (chunks: ReactNode) => (
  <ExternalLink href={href}>{chunks}</ExternalLink>
);
