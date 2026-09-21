import { Breadcrumb, Event, StackFrame } from '@sentry/browser';
import {
  beforeBreadcrumb,
  isFirstPartyEvent,
  withoutGiftToken,
  withoutGiftTokens,
} from './sentryEventFilter';

const anEventWithFrames = (frames: StackFrame[]): Event => ({
  exception: { values: [{ type: 'TypeError', stacktrace: { frames } }] },
});

describe('isFirstPartyEvent', () => {
  it('rejects an event thrown from a script injected into the document', () => {
    const event = anEventWithFrames([
      { filename: 'https://pension.tuleva.ee/account', lineno: 107, colno: 3 },
      { filename: 'https://pension.tuleva.ee/account', lineno: 107, colno: 3 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(false);
  });

  it('rejects an event thrown from an in-app browser instrumentation scheme', () => {
    const event = anEventWithFrames([
      { filename: 'iabjs://navigation_performance_logger_android', lineno: 1, colno: 1 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(false);
  });

  it('keeps an event with a frame from our own bundle', () => {
    const event = anEventWithFrames([
      { filename: 'iabjs://navigation_performance_logger_android', lineno: 1, colno: 1 },
      { filename: 'https://pension.tuleva.ee/static/js/main.9d3f1c2a.js', lineno: 2, colno: 42 },
    ]);

    expect(isFirstPartyEvent(event)).toBe(true);
  });

  it('keeps an event that carries no stack trace at all', () => {
    expect(isFirstPartyEvent({ message: 'Something worth reporting' })).toBe(true);
  });
});

describe('withoutGiftTokens', () => {
  it('replaces the token in the address of the page the event came from', () => {
    const event: Event = {
      request: { url: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN?language=et' },
    };

    expect(withoutGiftTokens(event).request?.url).toBe(
      'https://pension.tuleva.ee/kingitus/:token?language=et',
    );
  });

  it('replaces the token in the address the giver came from', () => {
    const event: Event = {
      request: {
        url: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN/tehtud',
        headers: { Referer: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN' },
      },
    };

    expect(withoutGiftTokens(event).request?.headers?.Referer).toBe(
      'https://pension.tuleva.ee/kingitus/:token',
    );
  });

  it('replaces the token in the api address of every breadcrumb', () => {
    const event: Event = {
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://pension.tuleva.ee/v1/gift-links/SECRETTOKEN' } },
        {
          category: 'xhr',
          data: { url: 'https://pension.tuleva.ee/v1/gift-links/SECRETTOKEN/payments' },
        },
      ],
    };

    expect(withoutGiftTokens(event).breadcrumbs?.map((breadcrumb) => breadcrumb.data?.url)).toEqual(
      [
        'https://pension.tuleva.ee/v1/gift-links/:token',
        'https://pension.tuleva.ee/v1/gift-links/:token/payments',
      ],
    );
  });

  it('leaves an event carrying no gift address untouched', () => {
    const event: Event = {
      request: { url: 'https://pension.tuleva.ee/account' },
      breadcrumbs: [{ category: 'fetch', data: { url: 'https://pension.tuleva.ee/v1/me' } }],
    };

    expect(withoutGiftTokens(event)).toEqual(event);
  });
});

describe('beforeBreadcrumb', () => {
  it('replaces the token in the api address a request breadcrumb records', () => {
    const breadcrumb: Breadcrumb = {
      category: 'fetch',
      data: {
        url: 'https://pension.tuleva.ee/v1/gift-links/SECRETTOKEN/payments',
        status_code: 500,
      },
    };

    expect(beforeBreadcrumb(breadcrumb).data).toEqual({
      url: 'https://pension.tuleva.ee/v1/gift-links/:token/payments',
      status_code: 500,
    });
  });

  it('replaces the tokens a navigation breadcrumb records on both sides of the step', () => {
    const breadcrumb: Breadcrumb = {
      category: 'navigation',
      data: { from: '/kingitus/SECRETTOKEN', to: '/kingitus/SECRETTOKEN/tehtud' },
    };

    expect(beforeBreadcrumb(breadcrumb).data).toEqual({
      from: '/kingitus/:token',
      to: '/kingitus/:token/tehtud',
    });
  });
});

describe('withoutGiftToken', () => {
  it('replaces the token in the path of a gift page', () => {
    expect(withoutGiftToken('/kingitus/SECRETTOKEN')).toBe('/kingitus/:token');
    expect(withoutGiftToken('/kingitus/SECRETTOKEN/tehtud')).toBe('/kingitus/:token/tehtud');
  });

  it('leaves a path that carries no gift token as it is', () => {
    expect(withoutGiftToken('/account')).toBe('/account');
  });
});
