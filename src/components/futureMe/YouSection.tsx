import React, { ReactNode, useRef } from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { HelpButton } from './HelpButton';
import { HelpTopic } from './helpTopics';

export interface YouSectionLabels {
  close: TranslationKey;
  closeLabel: TranslationKey;
  edit: TranslationKey;
  editLabel: TranslationKey;
  fill: TranslationKey;
  fillLabel: TranslationKey;
  incomplete: TranslationKey;
}

export interface YouOptionalLabels {
  add: TranslationKey;
  why: TranslationKey;
  remove: TranslationKey;
}

export interface YouOptionalSection {
  isAdded: boolean;
  labels: YouOptionalLabels;
  onAdd: () => void;
  onRemove: () => void;
}

interface Props {
  id: string;
  title: ReactNode;
  help?: HelpTopic;
  summary: ReactNode;
  labels: YouSectionLabels;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  optional?: YouOptionalSection;
  children: ReactNode;
}

export const YouSection = ({
  id,
  title,
  help,
  summary,
  labels,
  isOpen,
  isComplete,
  onToggle,
  optional,
  children,
}: Props) => {
  const intl = useIntl();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isIncluded = !optional || optional.isAdded;
  const [word, fullLabel] = (() => {
    if (isOpen) {
      return [labels.close, labels.closeLabel];
    }
    return isComplete ? [labels.edit, labels.editLabel] : [labels.fill, labels.fillLabel];
  })();

  const focusToggle = () => toggleRef.current?.focus();
  const add = () => {
    optional?.onAdd();
    focusToggle();
  };
  const remove = () => {
    optional?.onRemove();
    focusToggle();
  };
  const summaryText = (() => {
    if (!isIncluded && optional) {
      return intl.formatMessage({ id: optional.labels.why });
    }
    return isComplete ? summary : intl.formatMessage({ id: labels.incomplete });
  })();

  return (
    <li className={classNames('you-section', { 'is-open': isIncluded && isOpen })}>
      <div className="you-section-head">
        <div>
          <div className="you-section-title-line text-balance">
            <h3 className="you-section-title" id={`${id}-title`}>
              {title}
            </h3>
            {help && <HelpButton topic={help} />}
          </div>
          {!(isIncluded && isOpen) && (
            <small
              className={classNames('you-section-summary', {
                'is-empty': isIncluded && !isComplete,
              })}
            >
              {summaryText}
            </small>
          )}
        </div>
        {isIncluded ? (
          <button
            ref={toggleRef}
            type="button"
            className="btn btn-sm btn-link"
            aria-expanded={isOpen}
            aria-controls={`${id}-body`}
            aria-label={intl.formatMessage({ id: fullLabel })}
            onClick={onToggle}
          >
            {intl.formatMessage({ id: word })}
          </button>
        ) : (
          <button
            ref={toggleRef}
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={add}
          >
            <span aria-hidden="true">+ </span>
            {optional && intl.formatMessage({ id: optional.labels.add })}
          </button>
        )}
      </div>
      <div id={`${id}-body`} hidden={!isIncluded || !isOpen}>
        {children}
        {optional && (
          <div className="you-section-actions">
            <button type="button" className="btn btn-link btn-sm px-0" onClick={remove}>
              {intl.formatMessage({ id: optional.labels.remove })}
            </button>
          </div>
        )}
      </div>
    </li>
  );
};
