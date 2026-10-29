import React, { FormEvent, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { createTrackedEvent } from '../common/api';
import { getCurrentPath } from '../account/ComparisonCalculator/utility';
import { redactPii } from '../tracking/piiPatterns';

type Status = 'writing' | 'sending' | 'failed' | 'sent';

const FEEDBACK_FORM_VERSION = 1;

export const ResultFeedback = () => {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<Status>('writing');

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) {
      return;
    }
    setStatus('sending');
    try {
      await createTrackedEvent('CLICK', {
        target: 'future_me_feedback',
        path: getCurrentPath(),
        formVersion: FEEDBACK_FORM_VERSION,
        comment: redactPii(comment.trim()),
      });
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'sent') {
    return (
      <div className="result-feedback d-print-none mt-4" role="status">
        <p className="h5 section-title">
          <FormattedMessage id="futureMe.result.feedback.thanks.title" />
        </p>
        <p className="mb-0 text-pretty">
          <FormattedMessage id="futureMe.result.feedback.thanks.body" />
        </p>
      </div>
    );
  }

  return (
    <form className="result-feedback d-print-none mt-4" onSubmit={send}>
      <h3 className="h5 section-title text-balance">
        <label htmlFor="future-me-feedback">
          <FormattedMessage id="futureMe.result.feedback.label" />
        </label>
      </h3>
      <p className="form-text text-pretty mt-0" id="future-me-feedback-hint">
        <FormattedMessage id="futureMe.result.feedback.hint" />
      </p>
      <textarea
        id="future-me-feedback"
        className="form-control"
        rows={4}
        aria-describedby="future-me-feedback-hint"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {status === 'failed' && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          <FormattedMessage id="futureMe.result.feedback.failed" />
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={status === 'sending'}>
        <FormattedMessage id="futureMe.result.feedback.send" />
      </button>
    </form>
  );
};
