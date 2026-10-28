import React, { MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { HelpIcon } from './HelpIcon';
import { HelpTopic } from './helpTopics';
import { helpRichText } from './helpRichText';
import { lockPageScroll } from './scrollLock';

const WORD_JOINER = '\u2060';
const TITLE_ID = 'future-me-help-title';
const TRAILING_PUNCTUATION = /[?:]$/;

interface DialogProps {
  topic: HelpTopic;
  onClose: () => void;
}

const HelpDialog = ({ topic, onClose }: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    dialogRef.current?.showModal();
    titleRef.current?.focus();
    return lockPageScroll();
  }, []);

  const closeOnBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      dialogRef.current?.close();
    }
  };

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      className="future-me-help"
      aria-labelledby={TITLE_ID}
      onClose={onClose}
      onClick={closeOnBackdropClick}
    >
      <div className="help-head">
        <h2 className="h5 mb-0" id={TITLE_ID} tabIndex={-1} ref={titleRef}>
          <FormattedMessage id={`futureMe.help.${topic}.title` as TranslationKey} />
        </h2>
        <button type="button" className="help-close" onClick={() => dialogRef.current?.close()}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span className="visually-hidden">
            <FormattedMessage id="futureMe.help.close" />
          </span>
        </button>
      </div>
      <div className="help-body">
        <FormattedMessage
          id={`futureMe.help.${topic}.body` as TranslationKey}
          values={helpRichText}
        />
      </div>
    </dialog>,
    document.body,
  );
};

export const HelpButton = ({ topic }: { topic: HelpTopic }) => {
  const intl = useIntl();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const title = intl
    .formatMessage({ id: `futureMe.help.${topic}.title` as TranslationKey })
    .replace(TRAILING_PUNCTUATION, '');

  const close = () => {
    setIsOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      {WORD_JOINER}
      <button
        ref={buttonRef}
        type="button"
        className="help-btn"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <HelpIcon />
        <span className="visually-hidden">
          {intl.formatMessage({ id: 'futureMe.help.open' }, { title })}
        </span>
      </button>
      {isOpen && <HelpDialog topic={topic} onClose={close} />}
    </>
  );
};
