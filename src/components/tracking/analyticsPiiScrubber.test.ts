import { waitFor } from '@testing-library/react';
import * as piiPatterns from './piiPatterns';
import { installAnalyticsPiiScrubber, isAnalyticsEndpoint } from './analyticsPiiScrubber';

const GA4_COLLECT = 'https://region1.google-analytics.com/g/collect';
const META_PIXEL = 'https://www.facebook.com/tr/';
const ADS_REMARKETING = 'https://www.google.com/rmkt/collect/954385190/';
const HANDOVER_PAGE = `https://pension.tuleva.ee/trigger-procedure?handoverToken=${'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl'}&provider=COOP_PANK`;
const REDACTED_HANDOVER_PAGE =
  'https://pension.tuleva.ee/trigger-procedure?handoverToken=[token]&provider=COOP_PANK';

const readText = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

const fetchSpy = jest.fn();
const sendBeaconSpy = jest.fn();
const xhrOpenSpy = jest.fn();
const xhrSendSpy = jest.fn();
const formSubmitSpy = jest.fn();

beforeAll(() => {
  window.fetch = fetchSpy as unknown as typeof window.fetch;
  Object.defineProperty(navigator, 'sendBeacon', {
    value: sendBeaconSpy,
    configurable: true,
    writable: true,
  });
  XMLHttpRequest.prototype.open = xhrOpenSpy;
  XMLHttpRequest.prototype.send = xhrSendSpy;
  HTMLFormElement.prototype.submit = formSubmitSpy;

  installAnalyticsPiiScrubber();
});

beforeEach(() => {
  jest.restoreAllMocks();
  fetchSpy.mockResolvedValue('response');
  sendBeaconSpy.mockReturnValue(true);
});

describe('fetch', () => {
  it('redacts a personal code from the click text in the address of a GA4 hit and keeps every other byte', async () => {
    await window.fetch(
      `${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR&cid=1234567890.1727012345&en=click&ep.click_text=John%20Doe%20(39001011234)&dl=https%3A%2F%2Fpension.tuleva.ee%2Fsavings-fund%2Fonboarding%2Fchild`,
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      `${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR&cid=1234567890.1727012345&en=click&ep.click_text=John%20Doe%20(%5Bisikukood%5D)&dl=https%3A%2F%2Fpension.tuleva.ee%2Fsavings-fund%2Fonboarding%2Fchild`,
      undefined,
    );
  });

  it('redacts every line of a batched GA4 body and keeps the request options', async () => {
    const init: RequestInit = {
      method: 'POST',
      keepalive: true,
      mode: 'no-cors',
      credentials: 'include',
      body: 'en=click&ep.click_text=EE812233986174431932\r\nen=click&ep.click_text=Tagasi\r\nen=click&ep.click_text=39001011234',
    };

    await window.fetch(`${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR`, init);

    expect(fetchSpy).toHaveBeenCalledWith(`${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR`, {
      method: 'POST',
      keepalive: true,
      mode: 'no-cors',
      credentials: 'include',
      body: 'en=click&ep.click_text=%5Biban%5D\r\nen=click&ep.click_text=Tagasi\r\nen=click&ep.click_text=%5Bisikukood%5D',
    });
  });

  it('redacts a signed token and a gift token from the page address a hit reports', async () => {
    const handoverToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';
    const pageWithHandoverToken = encodeURIComponent(
      `https://pension.tuleva.ee/trigger-procedure?handoverToken=${handoverToken}&provider=COOP_PANK`,
    );
    const giftPage = encodeURIComponent('https://pension.tuleva.ee/kingitus/SECRETTOKEN');

    await window.fetch(`${GA4_COLLECT}?v=2&dl=${pageWithHandoverToken}&dr=${giftPage}`);

    const address = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(address.searchParams.get('dl')).toBe(
      'https://pension.tuleva.ee/trigger-procedure?handoverToken=[token]&provider=COOP_PANK',
    );
    expect(address.searchParams.get('dr')).toBe('https://pension.tuleva.ee/kingitus/:token');
  });

  it('redacts an email address that the page address carries percent-encoded twice', async () => {
    const page = encodeURIComponent(
      `https://pension.tuleva.ee/account?email=${encodeURIComponent('john.doe@example.com')}`,
    );

    await window.fetch(`${GA4_COLLECT}?v=2&dl=${page}`);

    const address = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(address.searchParams.get('dl')).toBe('https://pension.tuleva.ee/account?email=[email]');
  });

  it('redacts the text of a Blob body before sending it', async () => {
    const body = new Blob(['en=click&ep.click_text=39001011234'], { type: 'text/plain' });

    await window.fetch(GA4_COLLECT, { method: 'POST', body });

    const sentBody = (fetchSpy.mock.calls[0][1] as RequestInit).body as Blob;
    expect(await readText(sentBody)).toBe('en=click&ep.click_text=%5Bisikukood%5D');
    expect(sentBody.type).toBe('text/plain');
  });

  it('redacts a personal code that follows a stray percent sign in the same value', async () => {
    await window.fetch(`${GA4_COLLECT}?v=2&ep.click_text=5%%2039001011234`);
    await window.fetch(`${GA4_COLLECT}?v=2&ep.click_text=5%%20EE81%202233%209861%207443%201932`);

    expect(new URL(fetchSpy.mock.calls[0][0] as string).searchParams.get('ep.click_text')).toBe(
      '5% [isikukood]',
    );
    expect(new URL(fetchSpy.mock.calls[1][0] as string).searchParams.get('ep.click_text')).toBe(
      '5% [iban]',
    );
  });

  it('redacts a handover token cut off before its signature from the page address', async () => {
    const cutOffPage = encodeURIComponent(
      'https://pension.tuleva.ee/trigger-procedure?handoverToken=eyJhbGciOiJSUzUxMiJ9.eyJzaWduaW5nTWV0aG9kIjoic21hcnRJZ',
    );

    await window.fetch(`${GA4_COLLECT}?v=2&dl=${cutOffPage}`);

    const address = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(address.searchParams.get('dl')).toBe(
      'https://pension.tuleva.ee/trigger-procedure?handoverToken=[token]',
    );
  });

  it('drops the hashed user data the Google tag adds and keeps every other parameter as it was', async () => {
    await window.fetch(
      `${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR&em=tv.1~em.aGFzaGVk~pn.aGFzaGVk&emd=tvd.1~em.1&ecsid=1234567890&en=page_view`,
      { method: 'POST', body: 'en=click&em=tv.1~em.aGFzaGVk&ep.click_text=Tagasi' },
    );

    expect(fetchSpy).toHaveBeenCalledWith(`${GA4_COLLECT}?v=2&tid=G-2LNCGK63HR&en=page_view`, {
      method: 'POST',
      body: 'en=click&ep.click_text=Tagasi',
    });
  });

  it('redacts the string values of a JSON body and keeps its shape', async () => {
    const body = JSON.stringify({ events: [{ click_text: 'John 39001011234', count: 2 }] });

    await window.fetch(GA4_COLLECT, { method: 'POST', body });

    expect(JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)).toStrictEqual({
      events: [{ click_text: 'John [isikukood]', count: 2 }],
    });
  });

  it('leaves a JSON body without personal data exactly as it was', async () => {
    const body = '{ "click_text": "Tagasi" }';

    await window.fetch(GA4_COLLECT, { method: 'POST', body });

    expect((fetchSpy.mock.calls[0][1] as RequestInit).body).toBe(body);
  });

  it('redacts the address and the body of a Request object', async () => {
    await window.fetch(
      new Request(`${GA4_COLLECT}?v=2&ep.click_text=39001011234`, {
        method: 'POST',
        body: 'en=click&ep.click_text=EE812233986174431932',
      }),
    );

    const sent = fetchSpy.mock.calls[0][0] as Request;
    expect(sent.url).toBe(`${GA4_COLLECT}?v=2&ep.click_text=%5Bisikukood%5D`);
    expect(sent.method).toBe('POST');
    expect(await sent.text()).toBe('en=click&ep.click_text=%5Biban%5D');
  });

  it('passes a Request object to our own api through untouched', async () => {
    const request = new Request('/v1/members/lookup?personalCode=39001011234');

    await window.fetch(request);

    expect(fetchSpy.mock.calls[0][0]).toBe(request);
  });

  it('redacts the page address a Google Ads remarketing hit reports', async () => {
    await window.fetch(`${ADS_REMARKETING}?random=1&url=${encodeURIComponent(HANDOVER_PAGE)}`);

    const address = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(address.searchParams.get('url')).toBe(REDACTED_HANDOVER_PAGE);
    expect(address.searchParams.get('random')).toBe('1');
  });

  it('redacts a personal code carried in a parameter name or a path parameter', async () => {
    await window.fetch(`${GA4_COLLECT}?v=2&ep.39001011234=1`);
    await window.fetch('https://ad.doubleclick.net/activity;src=1;u1=39001011234;ord=1');

    expect(fetchSpy.mock.calls[0][0]).toBe(`${GA4_COLLECT}?v=2&ep.%5Bisikukood%5D=1`);
    expect(fetchSpy.mock.calls[1][0]).toBe(
      'https://ad.doubleclick.net/activity;src=1;u1=%5Bisikukood%5D;ord=1',
    );
  });

  it('passes a request to our own api through untouched', async () => {
    const init = { method: 'GET' };

    await window.fetch('/v1/members/lookup?personalCode=39001011234', init);

    expect(fetchSpy).toHaveBeenCalledWith('/v1/members/lookup?personalCode=39001011234', init);
    expect(fetchSpy.mock.calls[0][1]).toBe(init);
  });

  it('sends the original request when redacting fails', async () => {
    jest.spyOn(piiPatterns, 'redactPii').mockImplementation(() => {
      throw new Error('redaction failed');
    });
    const address = `${GA4_COLLECT}?v=2&ep.click_text=39001011234`;

    await window.fetch(address);

    expect(fetchSpy).toHaveBeenCalledWith(address, undefined);
  });
});

describe('sendBeacon', () => {
  it('redacts a GA4 beacon body', () => {
    const sent = navigator.sendBeacon(GA4_COLLECT, 'en=click&ep.click_text=john.doe%40example.com');

    expect(sent).toBe(true);
    expect(sendBeaconSpy).toHaveBeenCalledWith(GA4_COLLECT, 'en=click&ep.click_text=%5Bemail%5D');
  });

  it('redacts the fields of a Meta button click sent as form data', () => {
    const body = new FormData();
    body.append('id', '264307013931375');
    body.append('ev', 'SubscribedButtonClick');
    body.append('cd[buttonFeatures]', '{"innerText":"John Doe 39001011234"}');

    navigator.sendBeacon(META_PIXEL, body);

    const sentBody = sendBeaconSpy.mock.calls[0][1] as FormData;
    expect(sentBody.get('id')).toBe('264307013931375');
    expect(sentBody.get('ev')).toBe('SubscribedButtonClick');
    expect(sentBody.get('cd[buttonFeatures]')).toBe('{"innerText":"John Doe [isikukood]"}');
  });

  it('drops the hashed user data fields of a Meta event', () => {
    const body = new FormData();
    body.append('id', '264307013931375');
    body.append('ud[em]', 'aGFzaGVkIGVtYWls');
    body.append('udff[ph]', 'aGFzaGVkIHBob25l');
    body.append('cd[buttonText]', 'Edasi');

    navigator.sendBeacon(META_PIXEL, body);

    const sentBody = sendBeaconSpy.mock.calls[0][1] as FormData;
    expect(Array.from(sentBody.keys())).toStrictEqual(['id', 'cd[buttonText]']);
  });

  it('redacts the fields of a body sent as URLSearchParams', () => {
    navigator.sendBeacon(
      GA4_COLLECT,
      new URLSearchParams({ en: 'click', 'ep.click_text': 'EE81 2233 9861 7443 1932' }),
    );

    const sentBody = sendBeaconSpy.mock.calls[0][1] as URLSearchParams;
    expect(sentBody.toString()).toBe('en=click&ep.click_text=%5Biban%5D');
  });

  it('redacts a Blob body and sends it once it has been read', async () => {
    const sent = navigator.sendBeacon(
      GA4_COLLECT,
      new Blob(['en=click&ep.click_text=39001011234']),
    );

    expect(sent).toBe(true);
    await waitFor(() => expect(sendBeaconSpy).toHaveBeenCalledTimes(1));
    expect(await readText(sendBeaconSpy.mock.calls[0][1] as Blob)).toBe(
      'en=click&ep.click_text=%5Bisikukood%5D',
    );
  });

  it('redacts an IBAN from a form-encoded body that writes spaces as plus signs', () => {
    navigator.sendBeacon(GA4_COLLECT, 'en=click&ep.click_text=EE81+2233+9861+7443+1932&ep.x=a+b');

    expect(sendBeaconSpy).toHaveBeenCalledWith(
      GA4_COLLECT,
      'en=click&ep.click_text=%5Biban%5D&ep.x=a+b',
    );
  });

  it('sends the original body when the Blob cannot be read', async () => {
    const body = new Blob(['en=click']);
    jest
      .spyOn(FileReader.prototype, 'readAsText')
      .mockImplementation(function failToRead(this: FileReader) {
        this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
      });

    navigator.sendBeacon(GA4_COLLECT, body);

    await waitFor(() => expect(sendBeaconSpy).toHaveBeenCalledWith(GA4_COLLECT, body));
  });

  it('passes a beacon to another host through untouched', () => {
    const body = 'personalCode=39001011234';

    navigator.sendBeacon('https://onboarding-service.tuleva.ee/v1/events', body);

    expect(sendBeaconSpy).toHaveBeenCalledWith(
      'https://onboarding-service.tuleva.ee/v1/events',
      body,
    );
  });
});

describe('XMLHttpRequest', () => {
  it('redacts the address and the body of a request to Universal Analytics', () => {
    const request = new XMLHttpRequest();

    request.open('POST', 'https://www.google-analytics.com/j/collect?v=1&el=39001011234');
    request.send('v=1&t=event&el=EE812233986174431932');

    expect(xhrOpenSpy).toHaveBeenCalledWith(
      'POST',
      'https://www.google-analytics.com/j/collect?v=1&el=%5Bisikukood%5D',
    );
    expect(xhrSendSpy).toHaveBeenCalledWith('v=1&t=event&el=%5Biban%5D');
  });

  it('keeps the arguments of a request to our own api exactly as they were', () => {
    const request = new XMLHttpRequest();

    request.open('GET', '/v1/members/lookup?personalCode=39001011234', true);
    request.send(null);

    expect(xhrOpenSpy).toHaveBeenCalledWith(
      'GET',
      '/v1/members/lookup?personalCode=39001011234',
      true,
    );
    expect(xhrSendSpy).toHaveBeenCalledWith(null);
  });
});

describe('image pixels', () => {
  it('redacts the address of a Meta pixel image', () => {
    const pixel = new Image();

    pixel.src = `${META_PIXEL}?id=264307013931375&ev=SubscribedButtonClick&cd[buttonText]=John%20Doe%20EE812233986174431932`;

    expect(new URL(pixel.src).searchParams.get('cd[buttonText]')).toBe('John Doe [iban]');
    expect(new URL(pixel.src).searchParams.get('id')).toBe('264307013931375');
  });

  it('drops the hashed user data from the address of a Meta pixel image', () => {
    const pixel = new Image();

    pixel.src = `${META_PIXEL}?id=264307013931375&ev=PageView&ud[em]=aGFzaGVk&ud%5Bph%5D=aGFzaGVk&cd[x]=1`;

    expect(pixel.src).toBe(`${META_PIXEL}?id=264307013931375&ev=PageView&cd[x]=1`);
  });

  it('leaves the address of an ordinary image alone', () => {
    const image = new Image();

    image.src = 'https://tuleva.ee/wp-content/uploads/39001011234.png';

    expect(image.src).toBe('https://tuleva.ee/wp-content/uploads/39001011234.png');
  });
});

describe('scripts and frames', () => {
  const remarketingHit = `${ADS_REMARKETING}?random=1&url=${encodeURIComponent(HANDOVER_PAGE)}`;
  const redactedPage = (address: string) => new URL(address).searchParams.get('url');

  it('redacts the address of a script the Google tag adds to send a remarketing hit', () => {
    const script = document.createElement('script');

    script.src = remarketingHit;

    expect(redactedPage(script.src)).toBe(REDACTED_HANDOVER_PAGE);
  });

  it('redacts the address of a script given as an attribute', () => {
    const script = document.createElement('script');

    script.setAttribute('src', remarketingHit);

    expect(redactedPage(script.getAttribute('src') as string)).toBe(REDACTED_HANDOVER_PAGE);
  });

  it('redacts the address of a frame the Google tag opens', () => {
    const frame = document.createElement('iframe');
    const conversionHit = `https://googleads.g.doubleclick.net/pagead/viewthroughconversion/954385190/?url=${encodeURIComponent(
      HANDOVER_PAGE,
    )}`;

    frame.src = conversionHit;
    const framed = document.createElement('iframe');
    framed.setAttribute('SRC', conversionHit);

    expect(redactedPage(frame.src)).toBe(REDACTED_HANDOVER_PAGE);
    expect(redactedPage(framed.getAttribute('src') as string)).toBe(REDACTED_HANDOVER_PAGE);
  });

  it('leaves the address of an ordinary script and its other attributes alone', () => {
    const script = document.createElement('script');
    const address = 'https://inaadress.maaamet.ee/inaadress/js/inaadress.min.js?q=39001011234';

    script.src = address;
    script.setAttribute('data-code', '39001011234');

    expect(script.src).toBe(address);
    expect(script).toHaveAttribute('data-code', '39001011234');
  });

  it('sets the address it was given when redacting fails', () => {
    jest.spyOn(piiPatterns, 'redactPii').mockImplementation(() => {
      throw new Error('redaction failed');
    });
    const script = document.createElement('script');

    script.src = remarketingHit;

    expect(script.src).toBe(remarketingHit);
  });
});

describe('form posts', () => {
  it('redacts the fields of the hidden form Meta posts a long event with', () => {
    const form = document.createElement('form');
    form.action = META_PIXEL;
    const field = document.createElement('input');
    field.name = 'cd[buttonFeatures]';
    field.value = '{"innerText":"john.doe@example.com"}';
    form.appendChild(field);

    form.submit();

    expect(field.value).toBe('{"innerText":"[email]"}');
    expect(formSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('leaves out the hashed user data fields of the form Meta posts', () => {
    const form = document.createElement('form');
    form.action = META_PIXEL;
    const userData = document.createElement('input');
    userData.name = 'ud[em]';
    userData.value = 'aGFzaGVk';
    const eventName = document.createElement('input');
    eventName.name = 'ev';
    eventName.value = 'PageView';
    form.append(userData, eventName);

    form.submit();

    expect(
      Array.from(form.elements).map((field) => (field as HTMLInputElement).name),
    ).toStrictEqual(['ev']);
  });

  it('leaves the fields of an ordinary form alone', () => {
    const form = document.createElement('form');
    form.action = 'https://onboarding-service.tuleva.ee/idLogin';
    const field = document.createElement('input');
    field.name = 'personalCode';
    field.value = '39001011234';
    form.appendChild(field);

    form.submit();

    expect(field.value).toBe('39001011234');
    expect(formSubmitSpy).toHaveBeenCalledTimes(1);
  });
});

describe('installAnalyticsPiiScrubber', () => {
  it('wraps each transport only once when installed again', () => {
    const { fetch } = window;

    installAnalyticsPiiScrubber();

    expect(window.fetch).toBe(fetch);
  });
});

describe('isAnalyticsEndpoint', () => {
  it.each([
    'https://region1.google-analytics.com/g/collect?v=2',
    'https://www.google-analytics.com/j/collect',
    'https://region1.analytics.google.com/g/collect',
    'https://stats.g.doubleclick.net/g/collect',
    'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/954385190/',
    'https://www.googleadservices.com/pagead/conversion/954385190/',
    'https://www.google.com/pagead/1p-user-list/954385190/',
    'https://www.google.ee/ads/ga-audiences',
    'https://www.google.com/ccm/collect',
    'https://www.facebook.com/tr/',
    'https://www.facebook.com/tr?id=264307013931375&ev=PageView',
    'https://www.instagram.com/tr/',
    'https://adservice.google.com/pagead/regclk',
    'https://pagead2.googlesyndication.com/pagead/gen_204',
    'https://www.google.com/rmkt/collect/954385190/',
    'https://www.google.com/measurement/conversion/',
    'https://www.google.ee/pagead/1p-user-list/954385190/',
    'https://google.com/pagead/form-data/954385190',
    'https://www.google.com/g/collect',
    'https://www.googletagmanager.com/td?id=GTM-MRRG43',
    'https://www.facebook.com/privacy_sandbox/pixel/register/trigger/',
    'https://connect.facebook.net/signals/config/264307013931375',
  ])('treats %s as analytics', (address) => {
    expect(isAnalyticsEndpoint(address)).toBe(true);
  });

  it.each([
    '/v1/me',
    'https://onboarding-service.tuleva.ee/v1/me',
    'https://inaadress.maaamet.ee/inaadress/gazetteer?address=Tallinn',
    'https://www.google.com/maps',
    'https://www.google.com/recaptcha/api.js',
    'https://www.google.com.evil.example/rmkt/collect',
    'https://www.facebook.com/tuleva',
    'not a url at all ::',
  ])('does not treat %s as analytics', (address) => {
    expect(isAnalyticsEndpoint(address)).toBe(false);
  });
});
