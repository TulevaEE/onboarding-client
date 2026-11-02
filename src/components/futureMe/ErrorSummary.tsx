import React, { MouseEvent, ReactNode, RefObject } from 'react';
import { flushSync } from 'react-dom';
import { FormattedMessage } from 'react-intl';
import { YouSectionId } from './youAnswers';

export interface MissingField {
  id: string;
  label: ReactNode;
  section?: YouSectionId;
}

interface Props {
  fields: MissingField[];
  summaryRef: RefObject<HTMLDivElement>;
  onOpenSection: (section: YouSectionId) => void;
}

export const ErrorSummary = ({ fields, summaryRef, onOpenSection }: Props) => {
  const focusField =
    ({ id, section }: MissingField) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (section) {
        flushSync(() => onOpenSection(section));
      }
      document.getElementById(id)?.focus();
    };

  return (
    <div className="alert alert-danger error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
      <p className="mb-1">
        <FormattedMessage id="futureMe.errorSummary.intro" />
      </p>
      <ul className="mb-0">
        {fields.map((field) => (
          <li key={field.id}>
            <a href={`#${field.id}`} onClick={focusField(field)}>
              {field.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
