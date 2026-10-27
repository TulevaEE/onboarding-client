import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';
import { ChapterHead } from './ChapterHead';
import { StepId } from './steps';

interface Props {
  step: StepId;
  label: string;
  headingRef: RefObject<HTMLHeadingElement>;
}

export const PlaceholderStep = ({ step, label, headingRef }: Props) => (
  <section className="chapter card p-4" aria-labelledby="future-me-placeholder-heading">
    <ChapterHead step={step}>
      <h2
        id="future-me-placeholder-heading"
        className="text-balance"
        tabIndex={-1}
        ref={headingRef}
      >
        {label}
      </h2>
    </ChapterHead>
    <p>
      <FormattedMessage id="futureMe.placeholder.body" />
    </p>
  </section>
);
