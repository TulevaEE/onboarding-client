import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import { InfoTooltip } from './infoTooltip/InfoTooltip';

const CopiedIcon = () => (
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
);

const CopyIcon = () => (
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
);

const FEEDBACK_MILLISECONDS = 2000;

type Feedback = 'ready' | 'copied' | 'failed';

const copyThroughSelection = (text: string) => {
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  try {
    return typeof document.execCommand === 'function' && document.execCommand('copy');
  } finally {
    field.remove();
    previouslyFocused?.focus();
  }
};

const copyToClipboard = (text: string): Promise<boolean> => {
  if (!navigator.clipboard?.writeText) {
    return Promise.resolve(copyThroughSelection(text));
  }
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => copyThroughSelection(text),
  );
};

const useCopy = (textToCopy: string) => {
  const [feedback, setFeedback] = useState<Feedback>('ready');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const copy = async (onReset?: () => void) => {
    const copied = await copyToClipboard(textToCopy);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFeedback(copied ? 'copied' : 'failed');
    timeoutRef.current = setTimeout(() => {
      setFeedback('ready');
      onReset?.();
    }, FEEDBACK_MILLISECONDS);
  };

  return { feedback, copy };
};

const FEEDBACK_MESSAGES = {
  ready: 'global.copy',
  copied: 'global.copied',
  failed: 'global.copyFailed',
} as const;

const IconCopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const { feedback, copy } = useCopy(textToCopy);
  const [showTooltip, setShowTooltip] = useState(false);
  const intl = useIntl();

  const idRef = useRef<string>(`copy-tooltip-${Math.random().toString(36).slice(2)}`);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const copied = feedback === 'copied';

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

  const handleClick = async () => {
    await copy(hideCurrentTooltip);
    showCurrentTooltip();
  };

  const tooltipText = intl.formatMessage({ id: FEEDBACK_MESSAGES[feedback] });

  return (
    <>
      <button
        type="button"
        className={`btn p-1 border-0 focus-ring d-flex align-items-center position-relative ${
          copied ? 'text-success' : 'text-primary'
        }`}
        onClick={handleClick}
        aria-label={tooltipText}
        aria-describedby={showTooltip ? idRef.current : undefined}
        ref={targetRef}
        data-tip
        data-for={idRef.current}
        onMouseEnter={() => {
          if (feedback === 'ready') {
            showCurrentTooltip();
          }
        }}
        onMouseLeave={() => {
          if (feedback === 'ready') {
            hideCurrentTooltip();
          }
        }}
        onFocus={() => {
          if (feedback === 'ready') {
            showCurrentTooltip();
          }
        }}
        onBlur={() => {
          hideCurrentTooltip();
        }}
      >
        {copied ? <CopiedIcon /> : <CopyIcon />}
        <span aria-hidden="true">
          <InfoTooltip name={idRef.current} place="right" noTrigger>
            {tooltipText}
          </InfoTooltip>
        </span>
      </button>
      <span role="status" className="visually-hidden">
        {feedback !== 'ready' && tooltipText}
      </span>
    </>
  );
};

const QUIET_SUCCESS = {
  '--bs-btn-hover-bg': 'transparent',
  '--bs-btn-hover-color': 'var(--bs-success)',
  '--bs-btn-active-bg': 'transparent',
  '--bs-btn-active-color': 'var(--bs-success)',
} as CSSProperties;

const stackedLabel = (shown: boolean) =>
  ({ gridArea: '1 / 1', visibility: shown ? 'visible' : 'hidden' }) as const;

const LabelledCopyButton = ({
  textToCopy,
  label,
  prominent,
}: {
  textToCopy: string;
  label: ReactNode;
  prominent: boolean;
}) => {
  const { feedback, copy } = useCopy(textToCopy);
  const copied = feedback === 'copied';
  const size = prominent ? 'btn-lg' : '';
  const readyVariant = prominent ? 'btn-primary' : 'btn-outline-primary';
  const variant = copied ? 'btn-outline-success' : readyVariant;

  const labels: [Feedback, ReactNode][] = [
    ['ready', label],
    ['copied', <FormattedMessage id={FEEDBACK_MESSAGES.copied} />],
    ['failed', <FormattedMessage id={FEEDBACK_MESSAGES.failed} />],
  ];

  return (
    <>
      <button
        type="button"
        className={`btn ${size} ${variant} d-inline-flex align-items-center gap-2`}
        style={copied ? QUIET_SUCCESS : undefined}
        onClick={() => copy()}
      >
        {copied ? <CopiedIcon /> : <CopyIcon />}
        <span className="d-inline-grid">
          {labels.map(([state, text]) => (
            <span
              key={state}
              style={stackedLabel(state === feedback)}
              aria-hidden={state !== feedback || undefined}
            >
              {text}
            </span>
          ))}
        </span>
      </button>
      <span role="status" className="visually-hidden">
        {feedback !== 'ready' && <FormattedMessage id={FEEDBACK_MESSAGES[feedback]} />}
      </span>
    </>
  );
};

type CopyButtonProps = { textToCopy: string } & (
  { children: ReactNode; prominent?: boolean } | { children?: never; prominent?: never }
);

export const CopyButton = ({ textToCopy, prominent = false, children }: CopyButtonProps) =>
  children ? (
    <LabelledCopyButton textToCopy={textToCopy} label={children} prominent={prominent} />
  ) : (
    <IconCopyButton textToCopy={textToCopy} />
  );
