import React from 'react';

export const ScanFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const CORNER_STROKES_CLEAR_OF_THE_WHITE_TILE = 12;
  const SCAN_CORNERS =
    'M1 13V5a4 4 0 0 1 4-4h8M87 1h8a4 4 0 0 1 4 4v8M99 87v8a4 4 0 0 1-4 4h-8M13 99H5a4 4 0 0 1-4-4v-8';
  return (
    <div
      className="position-relative mx-auto"
      style={{
        width: 'fit-content',
        maxWidth: '100%',
        padding: CORNER_STROKES_CLEAR_OF_THE_WHITE_TILE,
      }}
      data-testid="qr-scan-frame"
    >
      <svg
        aria-hidden="true"
        className="position-absolute top-0 start-0 w-100 h-100 text-primary"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={SCAN_CORNERS}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {children}
    </div>
  );
};
