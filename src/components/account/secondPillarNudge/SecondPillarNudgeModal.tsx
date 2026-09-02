import React, { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styles from './SecondPillarNudgeModal.module.scss';
import { useSecondPillarNudge } from './useSecondPillarNudge';

const HEADING_ID = 'second-pillar-nudge-heading';

export const SecondPillarNudgeModal = () => {
  const { show, dismiss } = useSecondPillarNudge();
  const { formatMessage } = useIntl();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!show) {
      return undefined;
    }
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [show, dismiss]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={HEADING_ID}>
        <button
          type="button"
          ref={closeButtonRef}
          className={styles.close}
          onClick={dismiss}
          aria-label={formatMessage({ id: 'account.secondPillarNudge.close' })}
        >
          &times;
        </button>

        <div className={styles.steps}>
          <span className={styles.now}>
            <FormattedMessage id="account.secondPillarNudge.pill.now" />
          </span>
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
          <span>
            <FormattedMessage id="account.secondPillarNudge.pill.target" />
          </span>
        </div>

        <h2 id={HEADING_ID} className={styles.heading}>
          <FormattedMessage id="account.secondPillarNudge.heading" />
        </h2>
        <p className={styles.lead}>
          <FormattedMessage id="account.secondPillarNudge.lead" />
        </p>
        <p className={styles.body}>
          <FormattedMessage id="account.secondPillarNudge.body" />
        </p>
        <p className={styles.deadline}>
          <FormattedMessage id="account.secondPillarNudge.deadline" />
        </p>

        <div className={styles.actions}>
          <Link to="/2nd-pillar-payment-rate" className="btn btn-primary" onClick={dismiss}>
            <FormattedMessage id="account.secondPillarNudge.cta" />
          </Link>
          <button type="button" className="btn btn-link" onClick={dismiss}>
            <FormattedMessage id="account.secondPillarNudge.dismiss" />
          </button>
        </div>
      </div>
    </div>
  );
};
