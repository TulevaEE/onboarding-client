import React, { RefObject } from 'react';
import { FormattedMessage } from 'react-intl';

interface Props {
  label: string;
  headingRef: RefObject<HTMLHeadingElement>;
}

export const PlaceholderStep = ({ label, headingRef }: Props) => (
  <section className="chapter card p-4" aria-labelledby="future-me-placeholder-heading">
    <h2 id="future-me-placeholder-heading" tabIndex={-1} ref={headingRef}>
      {label}
    </h2>
    <p>
      <FormattedMessage id="futureMe.placeholder.body" />
    </p>
  </section>
);
