import { Breadcrumb, Event, StackFrame } from '@sentry/browser';
import { beforeBreadcrumb, isFirstPartyEvent, withoutPersonalData } from './sentryEventFilter';

const aHandoverToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';

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

describe('withoutPersonalData', () => {
  it('replaces the token in the address of the page the event came from', () => {
    const event: Event = {
      request: { url: 'https://pension.tuleva.ee/kingitus/SECRETTOKEN?language=et' },
    };

    expect(withoutPersonalData(event).request?.url).toBe(
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

    expect(withoutPersonalData(event).request?.headers?.Referer).toBe(
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

    expect(
      withoutPersonalData(event).breadcrumbs?.map((breadcrumb) => breadcrumb.data?.url),
    ).toEqual([
      'https://pension.tuleva.ee/v1/gift-links/:token',
      'https://pension.tuleva.ee/v1/gift-links/:token/payments',
    ]);
  });

  it('replaces the handover token in the address of the page the event came from', () => {
    const event: Event = {
      request: {
        url: `https://pension.tuleva.ee/trigger-procedure?handoverToken=${aHandoverToken}&provider=COOP_PANK`,
        query_string: `handoverToken=${aHandoverToken}&provider=COOP_PANK`,
      },
    };

    expect(withoutPersonalData(event).request).toStrictEqual({
      url: 'https://pension.tuleva.ee/trigger-procedure?handoverToken=%5Btoken%5D&provider=COOP_PANK',
      query_string: 'handoverToken=%5Btoken%5D&provider=COOP_PANK',
    });
  });

  it('replaces personal data in the message and the error of an event', () => {
    const event: Event = {
      message: 'Lookup failed for 39001011234',
      exception: {
        values: [{ type: 'Error', value: `Invalid handoverToken: ${aHandoverToken.slice(0, 30)}` }],
      },
    };

    const scrubbed = withoutPersonalData(event);

    expect(scrubbed.message).toBe('Lookup failed for [isikukood]');
    expect(scrubbed.exception?.values?.[0].value).toBe('Invalid handoverToken: [token]');
  });

  it('replaces the personal code in the api address of a breadcrumb the event carries', () => {
    const event: Event = {
      breadcrumbs: [
        { category: 'xhr', data: { url: '/v1/members/lookup?personalCode=39001011234' } },
      ],
    };

    expect(withoutPersonalData(event).breadcrumbs?.[0].data?.url).toBe(
      '/v1/members/lookup?personalCode=%5Bisikukood%5D',
    );
  });

  it('leaves an event carrying no gift address untouched', () => {
    const event: Event = {
      request: { url: 'https://pension.tuleva.ee/account' },
      breadcrumbs: [{ category: 'fetch', data: { url: 'https://pension.tuleva.ee/v1/me' } }],
    };

    expect(withoutPersonalData(event)).toEqual(event);
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

  it('replaces the personal code in the api address a request breadcrumb records', () => {
    const breadcrumb: Breadcrumb = {
      category: 'fetch',
      data: {
        url: 'https://onboarding-service.tuleva.ee/v1/members/lookup?personalCode=39001011234',
      },
    };

    expect(beforeBreadcrumb(breadcrumb).data?.url).toBe(
      'https://onboarding-service.tuleva.ee/v1/members/lookup?personalCode=%5Bisikukood%5D',
    );
  });

  it('replaces the handover token wherever a navigation breadcrumb records it', () => {
    const breadcrumb: Breadcrumb = {
      category: 'navigation',
      data: { from: `/trigger-procedure?handoverToken=abc.def&provider=COOP_PANK`, to: '/account' },
    };

    expect(beforeBreadcrumb(breadcrumb).data).toEqual({
      from: '/trigger-procedure?handoverToken=%5Btoken%5D&provider=COOP_PANK',
      to: '/account',
    });
  });

  it('replaces personal data in the message and the logged arguments of a console breadcrumb', () => {
    const breadcrumb: Breadcrumb = {
      category: 'console',
      message: `error on exchange Invalid handoverToken: ${aHandoverToken}`,
      data: { logger: 'console', arguments: ['error on exchange', 'IBAN EE812233986174431932', 3] },
    };

    const scrubbed = beforeBreadcrumb(breadcrumb);

    expect(scrubbed.message).toBe('error on exchange Invalid handoverToken: [token]');
    expect(scrubbed.data).toEqual({
      logger: 'console',
      arguments: ['error on exchange', 'IBAN [iban]', 3],
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
