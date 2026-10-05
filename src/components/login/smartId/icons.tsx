import React from 'react';

const ICON_SIZE = '1.25em';

export const SmartIdMarkIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={ICON_SIZE}
    height={ICON_SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="me-2 align-middle"
    aria-hidden="true"
    data-testid="smart-id-mark-icon"
  >
    <path d="M6.85 4.99A8.9 8.9 0 0 0 13.99 20.63V12.74" />
    <path d="M10.26 15.72V3.31A8.9 8.9 0 0 1 17.4 19.26" />
    <circle cx="13.8" cy="8.59" r="0.5" fill="currentColor" />
  </svg>
);

export const QrCodeIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={ICON_SIZE}
    height={ICON_SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="me-2 align-middle"
    aria-hidden="true"
    data-testid="qr-code-icon"
  >
    <path d="M3 8V4a1 1 0 0 1 1-1h4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M8 21H4a1 1 0 0 1-1-1v-4" />
    <rect x="7" y="7" width="4" height="4" rx="0.5" />
    <rect x="13" y="7" width="4" height="4" rx="0.5" />
    <rect x="7" y="13" width="4" height="4" rx="0.5" />
    <path
      d="M13 13h1.6v1.6H13zM15.4 15.4H17V17h-1.6zM13 15.4h1.6V17H13zM15.4 13H17v1.6h-1.6z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const IconBeforeLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => {
  const [firstWord, ...otherWords] = label.split(' ');
  return (
    <>
      <span className="text-nowrap">
        {icon}
        {firstWord}
      </span>
      {otherWords.length > 0 && ` ${otherWords.join(' ')}`}
    </>
  );
};
