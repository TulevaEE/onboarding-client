import { linkThatOpensTheSmartIdApp } from './linkThatOpensTheSmartIdApp';

describe('the link that opens the Smart-ID app', () => {
  const web2AppLink =
    'https://smart-id.com/device-link/?deviceLinkType=Web2App&sessionToken=TTTTTTTTTTTTTTTTTTTTTTTT&sessionType=auth&version=1.0&lang=est&authCode=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const userAgents = {
    samsungInternet:
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36',
    samsungInternetOnATablet:
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Safari/537.36',
    chromeAndroid:
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
    safariIphone:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
  };

  it.each([
    ['on a phone', userAgents.samsungInternet],
    ['on a tablet', userAgents.samsungInternetOnATablet],
  ])(
    'asks Android for the Smart-ID app by name in Samsung Internet %s, which keeps plain links to apps inside the browser, and falls back to the same link',
    (device, userAgent) => {
      expect(linkThatOpensTheSmartIdApp(web2AppLink, userAgent)).toBe(
        `intent://smart-id.com/device-link/?deviceLinkType=Web2App&sessionToken=TTTTTTTTTTTTTTTTTTTTTTTT&sessionType=auth&version=1.0&lang=est&authCode=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA#Intent;scheme=https;package=com.smart_id;S.browser_fallback_url=${encodeURIComponent(
          web2AppLink,
        )};end`,
      );
    },
  );

  it.each([
    ['Chrome on Android', userAgents.chromeAndroid],
    ['Safari on an iPhone', userAgents.safariIphone],
  ])('keeps the link as it is in %s, which opens the app from it', (browser, userAgent) => {
    expect(linkThatOpensTheSmartIdApp(web2AppLink, userAgent)).toBe(web2AppLink);
  });

  it('keeps a link it cannot read as it is', () => {
    expect(linkThatOpensTheSmartIdApp('not a link', userAgents.samsungInternet)).toBe('not a link');
  });

  it('keeps a link of another Smart-ID environment as it is, since only the live app is asked for by name', () => {
    const demoLink = 'https://sid.demo.sk.ee/device-link?deviceLinkType=Web2App&sessionToken=T';

    expect(linkThatOpensTheSmartIdApp(demoLink, userAgents.samsungInternet)).toBe(demoLink);
  });
});
