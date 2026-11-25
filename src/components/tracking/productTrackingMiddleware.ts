import { AnyAction, Middleware } from 'redux';
import { createTrackedEvent } from '../common/api';
import {
  GET_USER_SUCCESS,
  MOBILE_AUTHENTICATION_CANCEL,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_SUCCESS,
  WEB_EID_AUTHENTICATION_ERROR,
} from '../login/constants';
import { storedAttribution } from './attribution';
import { redactPii } from './piiPatterns';
import { trackCustomEvent } from './actions';

const ATTEMPTS_KEY = 'tuleva.loginAttempts';
const ATTRIBUTION_SENT_KEY = 'tuleva.attributionSent';
const MAX_FAILURES = 10;

type Failure = { kind: string; reason: string };
type LoginAttempts = { startedAt: number; starts: number; failures: Failure[]; method?: string };

const FAILURE_KIND: Record<string, string> = {
  [MOBILE_AUTHENTICATION_START_ERROR]: 'start_error',
  [MOBILE_AUTHENTICATION_ERROR]: 'error',
  [MOBILE_AUTHENTICATION_CANCEL]: 'cancel',
  [WEB_EID_AUTHENTICATION_ERROR]: 'id_card_error',
};

// The login can leave the page (Smart-ID app, callback), so attempts live in sessionStorage.
const readAttempts = (): LoginAttempts | null => {
  try {
    return JSON.parse(window.sessionStorage.getItem(ATTEMPTS_KEY) || 'null');
  } catch (error) {
    return null;
  }
};

const writeAttempts = (attempts: LoginAttempts | null): void => {
  try {
    if (attempts) {
      window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    } else {
      window.sessionStorage.removeItem(ATTEMPTS_KEY);
    }
  } catch (error) {
    // storage unavailable: the summary is skipped
  }
};

const attemptsSoFar = (now: number): LoginAttempts =>
  readAttempts() ?? { startedAt: now, starts: 0, failures: [] };

export const failureReason = (action: AnyAction): string => {
  const { error } = action;
  const code =
    action.errorCode ??
    error?.body?.errors?.[0]?.code ??
    error?.body?.error ??
    (typeof error === 'string' ? error : error?.message) ??
    'unknown';
  return redactPii(String(code)).slice(0, 80);
};

const sendLoginAttempts = (now: number): void => {
  const attempts = readAttempts();
  writeAttempts(null);
  if (!attempts || (attempts.starts === 0 && attempts.failures.length === 0)) {
    return;
  }
  createTrackedEvent('LOGIN_ATTEMPTS', {
    method: attempts.method ?? 'OTHER',
    starts: attempts.starts,
    failures: attempts.failures,
    secondsToLogin: Math.round((now - attempts.startedAt) / 1000),
  }).catch(() => {});
};

const sendAttributionWhenNew = (userId: unknown): void => {
  const attribution = storedAttribution();
  if (!attribution) {
    return;
  }
  const marker = `${String(userId)}:${attribution.first.at}:${attribution.last.at}`;
  try {
    if (window.localStorage.getItem(ATTRIBUTION_SENT_KEY) === marker) {
      return;
    }
    window.localStorage.setItem(ATTRIBUTION_SENT_KEY, marker);
  } catch (error) {
    return;
  }
  createTrackedEvent('ATTRIBUTION', { ...attribution }).catch(() => {});
};

const track = (action: AnyAction, now: number): void => {
  if (action.type === MOBILE_AUTHENTICATION_START) {
    const attempts = attemptsSoFar(now);
    writeAttempts({ ...attempts, starts: attempts.starts + 1 });
    // event_log only takes events from logged-in people; GA4 also sees the ones who give up
    trackCustomEvent('login_start', {});
  } else if (FAILURE_KIND[action.type]) {
    const attempts = attemptsSoFar(now);
    const failure = { kind: FAILURE_KIND[action.type], reason: failureReason(action) };
    writeAttempts({ ...attempts, failures: [...attempts.failures, failure].slice(-MAX_FAILURES) });
    trackCustomEvent('login_failure', {
      failure_kind: failure.kind,
      failure_reason: failure.reason,
    });
  } else if (action.type === MOBILE_AUTHENTICATION_SUCCESS) {
    writeAttempts({ ...attemptsSoFar(now), method: action.method });
  } else if (action.type === GET_USER_SUCCESS) {
    sendLoginAttempts(now);
    sendAttributionWhenNew(action.user?.id);
  }
};

// Product analytics into event_log: how logins go, and where people came from.
export const productTrackingMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);
  try {
    track(action as AnyAction, Date.now());
  } catch (error) {
    // tracking must never break the app
  }
  return result;
};
