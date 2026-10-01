export {};

const GA4_COLLECT = 'https://region1.google-analytics.com/g/collect';

const loadFreshScrubber = (): typeof import('./analyticsPiiScrubber') => {
  let scrubber: typeof import('./analyticsPiiScrubber') | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    scrubber = require('./analyticsPiiScrubber');
  });
  return scrubber as typeof import('./analyticsPiiScrubber');
};

describe('installAnalyticsPiiScrubber when the browser refuses a hook', () => {
  const originalSubmit = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'submit');
  const fetchSpy = jest.fn();

  beforeEach(() => {
    window.fetch = fetchSpy as unknown as typeof window.fetch;
    Object.defineProperty(HTMLFormElement.prototype, 'submit', {
      value: jest.fn(),
      writable: false,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalSubmit) {
      Object.defineProperty(HTMLFormElement.prototype, 'submit', originalSubmit);
    }
  });

  it('does not break page start-up and still installs the other hooks', async () => {
    const { installAnalyticsPiiScrubber } = loadFreshScrubber();

    expect(() => installAnalyticsPiiScrubber()).not.toThrow();

    await window.fetch(`${GA4_COLLECT}?en=click&ep.click_text=39001011234`);
    expect(fetchSpy).toHaveBeenCalledWith(
      `${GA4_COLLECT}?en=click&ep.click_text=%5Bisikukood%5D`,
      undefined,
    );
  });
});
