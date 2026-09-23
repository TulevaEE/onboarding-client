import { waitFor } from '@testing-library/react';
import * as piiPatterns from './piiPatterns';
import { installAnalyticsPiiScrubber, isAnalyticsEndpoint } from './analyticsPiiScrubber';

const GA4_COLLECT = 'https://region1.google-analytics.com/g/collect';
const META_PIXEL = 'https://www.facebook.com/tr/';

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

  it('leaves the address of an ordinary image alone', () => {
    const image = new Image();

    image.src = 'https://tuleva.ee/wp-content/uploads/39001011234.png';

    expect(image.src).toBe('https://tuleva.ee/wp-content/uploads/39001011234.png');
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
  ])('treats %s as analytics', (address) => {
    expect(isAnalyticsEndpoint(address)).toBe(true);
  });

  it.each([
    '/v1/me',
    'https://onboarding-service.tuleva.ee/v1/me',
    'https://inaadress.maaamet.ee/inaadress/gazetteer?address=Tallinn',
    'https://www.google.com/maps',
    'https://www.facebook.com/tuleva',
    'not a url at all ::',
  ])('does not treat %s as analytics', (address) => {
    expect(isAnalyticsEndpoint(address)).toBe(false);
  });
});
