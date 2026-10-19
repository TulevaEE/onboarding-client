import { configureScope } from '@sentry/browser';
import { Dispatch } from 'redux';

import { LOG_OUT } from './constants';

export function endTheSession(dispatch: Dispatch): void {
  if (process.env.NODE_ENV === 'production') {
    configureScope((scope) => {
      scope.clear();
    });
  }
  dispatch({ type: LOG_OUT });
}
