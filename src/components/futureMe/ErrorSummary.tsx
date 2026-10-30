import React, { MouseEvent, ReactNode, RefObject } from 'react';
import { FormattedMessage } from 'react-intl';

export interface MissingField {
  id: string;
  label: ReactNode;
}

interface Props {
  fields: MissingField[];
  summaryRef: RefObject<HTMLDivElement>;
}

const focusField = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  document.getElementById(id)?.focus();
};

export const ErrorSummary = ({ fields, summaryRef }: Props) => (
  <div className="alert alert-danger error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
    <p className="mb-1">
      <FormattedMessage id="futureMe.errorSummary.intro" />
    </p>
    <ul className="mb-0">
      {fields.map(({ id, label }) => (
        <li key={id}>
          <a href={`#${id}`} onClick={focusField(id)}>
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);
