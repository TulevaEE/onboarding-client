import React, { ReactNode } from 'react';
import { StepIcon } from './FutureMeIcon';
import { StepId } from './steps';

export const ChapterHead = ({ step, children }: { step: StepId; children: ReactNode }) => (
  <div className="chapter-head">
    <span className="chapter-art" aria-hidden="true">
      <StepIcon step={step} />
    </span>
    <div className="chapter-head-text" tabIndex={-1}>
      {children}
    </div>
  </div>
);
