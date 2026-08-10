import type { BrowserOptions } from '@sentry/browser';
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

    expect(filter(ourEvent)).toBe(ourEvent);
  });
});
