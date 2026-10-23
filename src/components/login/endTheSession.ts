import { getCurrentScope, getIsolationScope } from '@sentry/browser';
import { Dispatch } from 'redux';

import { LOG_OUT } from './constants';

const forgetWhoErrorsAreReportedForAndWhatTheyDid = () => {
  const scope = getIsolationScope();
  scope.setUser(null);
  scope.clearBreadcrumbs();
};

const aNewTraceId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

const reportFurtherErrorsOnANewTrace = () =>
  getCurrentScope().setPropagationContext({ traceId: aNewTraceId(), sampleRand: Math.random() });

export function endTheSession(dispatch: Dispatch): void {
  if (process.env.NODE_ENV === 'production') {
    forgetWhoErrorsAreReportedForAndWhatTheyDid();
    reportFurtherErrorsOnANewTrace();
  }
  dispatch({ type: LOG_OUT });
}
