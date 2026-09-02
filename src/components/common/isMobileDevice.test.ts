import { isMobileDevice } from './isMobileDevice';

describe('isMobileDevice', () => {
  const originalUserAgent = navigator.userAgent;
  const macUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';

  const setUserAgent = (userAgent: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

  const setTouchPoints = (maxTouchPoints: number) =>
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: maxTouchPoints,
      configurable: true,
    });

  beforeEach(() => setTouchPoints(0));

  afterEach(() => setUserAgent(originalUserAgent));

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
  ])('recognizes %s as a mobile device', (userAgent) => {
    setUserAgent(userAgent);

    expect(isMobileDevice()).toBe(true);
  });

  it.each([
    macUserAgent,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ])('recognizes %s as a desktop device', (userAgent) => {
    setUserAgent(userAgent);

    expect(isMobileDevice()).toBe(false);
  });

  it('recognizes a touch screen behind a desktop user agent as an iPad', () => {
    setUserAgent(macUserAgent);
    setTouchPoints(5);

    expect(isMobileDevice()).toBe(true);
  });
});
