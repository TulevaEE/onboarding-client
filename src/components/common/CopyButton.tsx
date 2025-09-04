import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import { InfoTooltip } from './infoTooltip/InfoTooltip';

export const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const intl = useIntl();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef<string>(`copy-tooltip-${Math.random().toString(36).slice(2)}`);
  const targetRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = async () => {
    await navigator.clipboard.writeText(textToCopy);

    // Reset any previous hide timer to keep tooltip visible from this click
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show "Copied" and ensure it's the only visible tooltip
    setCopied(true);
    showCurrentTooltip();

    // Force-hide after timeout regardless of hover/focus
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      hideCurrentTooltip();
    }, 2000);
  };

  // Show/hide helpers; always hide others first to keep a single visible tooltip
  const showCurrentTooltip = () => {
    ReactTooltip.hide();
    setShowTooltip(true);
    if (targetRef.current) {
      ReactTooltip.show(targetRef.current);
    }
  };
  const hideCurrentTooltip = () => {
    setShowTooltip(false);
    if (targetRef.current) {
      ReactTooltip.hide(targetRef.current);
    }
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const copiedText = intl.formatMessage({ id: 'global.copied' });
  const copyText = intl.formatMessage({ id: 'global.copy' });

  return (
    <button
      type="button"
      className={`btn p-1 border-0 focus-ring d-flex align-items-center position-relative ${
        copied ? 'text-success' : 'text-primary'
      }`}
      onClick={handleClick}
      aria-label={copied ? copiedText : copyText}
      aria-describedby={showTooltip ? idRef.current : undefined}
      ref={targetRef}
      data-tip
      data-for={idRef.current}
      onMouseEnter={() => {
        if (!copied) {
          showCurrentTooltip();
        }
      }}
      onMouseLeave={() => {
        if (!copied) {
          hideCurrentTooltip();
        }
      }}
      onFocus={() => {
        if (!copied) {
          showCurrentTooltip();
        }
      }}
      onBlur={() => {
        hideCurrentTooltip();
      }}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
          />
        </svg>
      )}
      <InfoTooltip name={idRef.current} place="right" noTrigger>
        {copied ? copiedText : copyText}
      </InfoTooltip>
    </button>
  );
};
