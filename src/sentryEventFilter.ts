import { Breadcrumb, Event } from '@sentry/browser';
import {
  redactPiiInAddress,
  redactPiiInQuery,
  redactPiiInText,
} from './components/tracking/piiInAddress';

const OWN_BUNDLE_PATH = '/static/js/';
const BREADCRUMB_ADDRESS_FIELDS = ['url', 'from', 'to'];
const LOGGED_ARGUMENTS_FIELD = 'arguments';

export function isFirstPartyEvent(event: Event): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;

  if (!frames?.length) {
    return true;
  }

  return frames.some((frame) => frame.filename?.includes(OWN_BUNDLE_PATH));
}

const redactedIfText = <T>(value: T, redact: (text: string) => string): T | string =>
  typeof value === 'string' ? redact(value) : value;

const redactedLoggedArguments = (loggedArguments: unknown): unknown =>
  Array.isArray(loggedArguments)
    ? loggedArguments.map((argument) => redactedIfText(argument, redactPiiInText))
    : loggedArguments;

const redactedBreadcrumbData = (data: Breadcrumb['data']): Breadcrumb['data'] => {
  if (!data) {
    return data;
  }
  const redacted = { ...data };
  BREADCRUMB_ADDRESS_FIELDS.filter((field) => field in redacted).forEach((field) => {
    redacted[field] = redactedIfText(redacted[field], redactPiiInAddress);
  });
  if (LOGGED_ARGUMENTS_FIELD in redacted) {
    redacted[LOGGED_ARGUMENTS_FIELD] = redactedLoggedArguments(redacted[LOGGED_ARGUMENTS_FIELD]);
  }
  return redacted;
};

export function beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb.data && breadcrumb.message === undefined) {
    return breadcrumb;
  }

  return {
    ...breadcrumb,
    ...(breadcrumb.message !== undefined && {
      message: redactPiiInText(breadcrumb.message),
    }),
    ...(breadcrumb.data && { data: redactedBreadcrumbData(breadcrumb.data) }),
  };
}

const redactedRequest = (request: Event['request']): Event['request'] => {
  if (!request) {
    return request;
  }

  const { url, headers, query_string: queryString } = request;
  return {
    ...request,
    ...(url !== undefined && { url: redactPiiInAddress(url) }),
    ...(typeof queryString === 'string' && { query_string: redactPiiInQuery(queryString) }),
    ...(headers?.Referer && {
      headers: { ...headers, Referer: redactPiiInAddress(headers.Referer) },
    }),
  };
};

const redactedException = (exception: Event['exception']): Event['exception'] =>
  exception?.values
    ? {
        ...exception,
        values: exception.values.map((value) => ({
          ...value,
          ...(value.value !== undefined && { value: redactPiiInText(value.value) }),
        })),
      }
    : exception;

export function withoutPersonalData(event: Event): Event {
  return {
    ...event,
    ...(event.message !== undefined && { message: redactPiiInText(event.message) }),
    ...(event.exception && { exception: redactedException(event.exception) }),
    ...(event.request && { request: redactedRequest(event.request) }),
    ...(event.breadcrumbs && { breadcrumbs: event.breadcrumbs.map(beforeBreadcrumb) }),
  };
}
