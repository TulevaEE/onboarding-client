import { FocusEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import uniqueId from 'lodash/uniqueId';
import { TranslationKey } from '../../translations';
import { popoverOffset } from './popoverOffset';
import styles from './ActionHints.module.scss';

export type ActionHint = { label: TranslationKey; text: TranslationKey };

type OpenHint = { label: TranslationKey; pinned: boolean };

type HintProps = ActionHint & {
  isOpen: boolean;
  onToggle: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
  onClose: () => void;
};

const SCREEN_CHANGES = ['resize', 'orientationchange'];

const Hint = ({ label, text, isOpen, onToggle, onHover, onHoverEnd, onClose }: HintProps) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const [popoverId] = useState(() => uniqueId('action-hint-'));
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const placePopover = () => {
      if (!triggerRef.current || !popoverRef.current) {
        return;
      }
      const trigger = triggerRef.current.getBoundingClientRect();
      setOffset(
        popoverOffset({
          triggerLeft: trigger.left,
          triggerRight: trigger.right,
          popoverWidth: popoverRef.current.offsetWidth,
          viewportWidth: document.documentElement.clientWidth,
        }),
      );
    };
    placePopover();
    SCREEN_CHANGES.forEach((change) => window.addEventListener(change, placePopover));
    return () =>
      SCREEN_CHANGES.forEach((change) => window.removeEventListener(change, placePopover));
  }, [isOpen]);

  const closeWhenFocusLeaves = (event: FocusEvent) => {
    const nextFocused = event.relatedTarget as Node | null;
    if (nextFocused && !triggerRef.current?.contains(nextFocused)) {
      onClose();
    }
  };

  return (
    <span
      ref={triggerRef}
      className={styles.hint}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onBlur={closeWhenFocusLeaves}
    >
      <button
        type="button"
        className="btn btn-link p-0 border-0 align-baseline text-body-secondary"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={onToggle}
      >
        <FormattedMessage id={label} />
      </button>
      <span
        ref={popoverRef}
        id={popoverId}
        className={styles.popover}
        style={{ left: offset }}
        hidden={!isOpen}
      >
        <FormattedMessage id={text} />
      </span>
    </span>
  );
};

export const ActionHints = ({ hints }: { hints: ActionHint[] }) => {
  const [openHint, setOpenHint] = useState<OpenHint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openHint) {
      return undefined;
    }
    const closeOnClickElsewhere = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenHint(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenHint(null);
      }
    };
    document.addEventListener('mousedown', closeOnClickElsewhere);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnClickElsewhere);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openHint]);

  const toggle = (label: TranslationKey) =>
    setOpenHint((current) =>
      current?.label === label && current.pinned ? null : { label, pinned: true },
    );

  const showWhileHovered = (label: TranslationKey) =>
    setOpenHint((current) =>
      current?.label === label || current?.pinned ? current : { label, pinned: false },
    );

  const hideAfterHover = (label: TranslationKey) =>
    setOpenHint((current) => (current?.label === label && !current.pinned ? null : current));

  const close = (label: TranslationKey) =>
    setOpenHint((current) => (current?.label === label ? null : current));

  return (
    <div ref={containerRef} className="d-flex flex-wrap column-gap-3 row-gap-2">
      {hints.map(({ label, text }) => (
        <Hint
          key={label}
          label={label}
          text={text}
          isOpen={openHint?.label === label}
          onToggle={() => toggle(label)}
          onHover={() => showWhileHovered(label)}
          onHoverEnd={() => hideAfterHover(label)}
          onClose={() => close(label)}
        />
      ))}
    </div>
  );
};
