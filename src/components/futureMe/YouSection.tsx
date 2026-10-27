import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../translations';

export interface YouSectionLabels {
  close: TranslationKey;
  closeLabel: TranslationKey;
  edit: TranslationKey;
  editLabel: TranslationKey;
  fill: TranslationKey;
  fillLabel: TranslationKey;
  incomplete: TranslationKey;
}

interface Props {
  id: string;
  title: ReactNode;
  summary: ReactNode;
  labels: YouSectionLabels;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const YouSection = ({
  id,
  title,
  summary,
  labels,
  isOpen,
  isComplete,
  onToggle,
  children,
}: Props) => {
  const intl = useIntl();
  const [word, fullLabel] = (() => {
    if (isOpen) {
      return [labels.close, labels.closeLabel];
    }
    return isComplete ? [labels.edit, labels.editLabel] : [labels.fill, labels.fillLabel];
  })();

  return (
    <li className={classNames('you-section', { 'is-open': isOpen })}>
      <div className="you-section-head">
        <div>
          <h3 className="you-section-title" id={`${id}-title`}>
            {title}
          </h3>
          {!isOpen && (
            <small className={classNames('you-section-summary', { 'is-empty': !isComplete })}>
              {isComplete ? summary : intl.formatMessage({ id: labels.incomplete })}
            </small>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link"
          aria-expanded={isOpen}
          aria-controls={`${id}-body`}
          aria-label={intl.formatMessage({ id: fullLabel })}
          onClick={onToggle}
        >
          {intl.formatMessage({ id: word })}
        </button>
      </div>
      <div id={`${id}-body`} hidden={!isOpen}>
        {children}
      </div>
    </li>
  );
};
