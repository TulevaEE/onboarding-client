import { deviceClass } from './deviceClass';

describe('deviceClass', () => {
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
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
  ])('recognizes %s as a phone', (userAgent) => {
    setUserAgent(userAgent);

    expect(deviceClass()).toBe('phone');
  });

  it.each([
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  ])('recognizes %s as a tablet', (userAgent) => {
    setUserAgent(userAgent);

    expect(deviceClass()).toBe('tablet');
  });

  it.each([
    macUserAgent,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ])('recognizes %s as a computer', (userAgent) => {
    setUserAgent(userAgent);

    expect(deviceClass()).toBe('computer');
  });

  it('recognizes a touch screen behind a desktop user agent as an iPad', () => {
    setUserAgent(macUserAgent);
    setTouchPoints(5);

    expect(deviceClass()).toBe('tablet');
  });

  it('keeps a touch screen behind a Windows user agent a computer', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    setTouchPoints(10);

    expect(deviceClass()).toBe('computer');
  });
});
