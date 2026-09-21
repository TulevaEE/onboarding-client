import type { Breadcrumb, BrowserOptions } from '@sentry/browser';
import type { ErrorEvent } from '@sentry/types';

const mockSentryInit = jest.fn();

const setNodeEnv = (value: string) => {
  (process.env as Record<string, string>).NODE_ENV = value;
};

jest.mock('@sentry/browser', () => ({
  init: mockSentryInit,
  captureException: jest.fn(),
}));

describe('Sentry initialization in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let options: BrowserOptions;

  beforeAll(() => {
    setNodeEnv('production');
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      require('./polyfills');
    });
    [[options]] = mockSentryInit.mock.calls;
  });

  afterAll(() => {
    setNodeEnv(originalNodeEnv as string);
  });

  const matchesADeniedUrl = (url: string) =>
    (options.denyUrls as RegExp[]).some((pattern) => pattern.test(url));

  const filter = (event: ErrorEvent) => options.beforeSend?.(event, {});

  it('denies urls of scripts injected by in-app browsers and extensions', () => {
    expect(matchesADeniedUrl('iabjs://navigation_performance_logger_android')).toBe(true);
    expect(matchesADeniedUrl('chrome-extension://abcdef/contentScript.js')).toBe(true);
    expect(matchesADeniedUrl('moz-extension://abcdef/contentScript.js')).toBe(true);
    expect(matchesADeniedUrl('https://pension.tuleva.ee/static/js/main.9d3f1c2a.js')).toBe(false);
  });

  it('drops events without a single frame from our own bundle', () => {
    const injectedScriptEvent: ErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {
            type: 'TypeError',
            stacktrace: {
              frames: [{ filename: 'https://pension.tuleva.ee/account', lineno: 107 }],
            },
          },
        ],
      },
    };

    expect(filter(injectedScriptEvent)).toBeNull();
  });

  it('keeps events raised by our own bundle', () => {
    const ourEvent: ErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {
            type: 'TypeError',
            stacktrace: {
              frames: [{ filename: 'https://pension.tuleva.ee/static/js/main.9d3f1c2a.js' }],
            },
          },
        ],
      },
    };

    expect(filter(ourEvent)).toEqual(ourEvent);
  });

  it('keeps the gift token out of the addresses an event carries', () => {
    const giftPageEvent: ErrorEvent = {
      type: undefined,
      request: {
        url: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN',
        headers: { Referer: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN' },
      },
      breadcrumbs: [
        {
          category: 'fetch',
          data: { url: 'https://pension.tuleva.ee/v1/gift-links/SECRETTOKEN/payments' },
        },
      ],
    };

    expect(filter(giftPageEvent)).toEqual({
      type: undefined,
      request: {
        url: 'https://pension.tuleva.ee/kingitus/:token',
        headers: { Referer: 'https://pension.tuleva.ee/kingitus/:token' },
      },
      breadcrumbs: [
        {
          category: 'fetch',
          data: { url: 'https://pension.tuleva.ee/v1/gift-links/:token/payments' },
        },
      ],
    });
  });

  it('keeps the gift token out of a breadcrumb as it is recorded', () => {
    const requestBreadcrumb: Breadcrumb = {
      category: 'xhr',
      data: { url: 'https://pension.tuleva.ee/v1/gift-links/SECRETTOKEN' },
    };

    expect(options.beforeBreadcrumb?.(requestBreadcrumb, {})).toEqual({
      category: 'xhr',
      data: { url: 'https://pension.tuleva.ee/v1/gift-links/:token' },
    });
  });
});
