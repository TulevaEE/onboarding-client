import React, { useLayoutEffect, useRef } from 'react';
import { formatAmountForCurrency } from '../utils';
import './EditableEuro.scss';

// The number part of a euro figure, without the " €" suffix — only the digits are
// edited. Estonian omits the thousands separator below 10 000 ("6000", "10 000").
const euroAmount = (value: number): string => {
  const formatted = formatAmountForCurrency(value, 0);
  const compact =
    Math.abs(value) < 10000 ? formatted.replace(/(\d)\u00A0(\d)/g, '$1$2') : formatted;
  return compact.replace(/[\s]*€$/, '');
};

// A euro figure you can edit in place by clicking it: no input box, just the number.
// Clicking places a caret and it behaves like any text field. Only the amount is editable,
// with a static " €" beside it, and the value follows every keystroke. It clamps to `max`,
// which lets a power user type an amount past a slider's cap.
//
// The DOM text is driven by a ref, not by React children: pushing `value` back into the
// node only when the change came from OUTSIDE (a slider), never while the user is typing
// here — otherwise React would rewrite the text on each keystroke and jump the caret.
export const EditableEuro: React.FC<{
  value: number;
  max: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
  className?: string;
}> = ({ value, max, ariaLabel, onCommit, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el) {
      el.textContent = euroAmount(value);
    }
  }, [value]);
  const read = (el: HTMLElement): number => {
    const digits = (el.textContent ?? '').replace(/\D/g, '');
    return Math.min(Math.max(parseInt(digits || '0', 10), 0), max);
  };
  return (
    <span className={className}>
      <span
        ref={ref}
        className="editable-euro"
        role="textbox"
        aria-label={ariaLabel}
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => {
          const el = event.currentTarget;
          const next = read(el);
          onCommit(next);
          // Snap the visible text back to canonical form the instant it drifts — an
          // overflow past the cap, leading zeros, pasted non-digits — so a long string can
          // never stretch the layout. Normal in-range digits already match, so the caret
          // is left alone; only a rewrite moves it (to the end, where typing continues).
          const canonical = euroAmount(next);
          if (el.textContent !== canonical) {
            // eslint-disable-next-line no-param-reassign
            el.textContent = canonical;
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const next = read(event.currentTarget);
          onCommit(next);
          // Normalise the display once editing ends (clamped value, stray characters gone).
          // eslint-disable-next-line no-param-reassign
          event.currentTarget.textContent = euroAmount(next);
        }}
      />
      {/* Static and click-through: the number's wide right padding reaches under it,
          so a click on the euro still focuses the number rather than dead-ending here. */}
      <span style={{ pointerEvents: 'none' }}>{'\u00A0€'}</span>
    </span>
  );
};
