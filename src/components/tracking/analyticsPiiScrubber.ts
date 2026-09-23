import { redactPii } from './piiPatterns';
import { withoutGiftToken } from '../../sentryEventFilter';

interface Endpoint {
  host: RegExp;
  path: RegExp;
}

type Body = BodyInit | Document | null | undefined;

const ANY_PATH = /^\//;
const GOOGLE_TAG_PATH = /^\/(pagead|ads|ccm|g)\//;
const PIXEL_PATH = /^\/tr\/?$/;

const ANALYTICS_ENDPOINTS: Endpoint[] = [
  { host: /(^|\.)google-analytics\.com$/, path: ANY_PATH },
  { host: /(^|\.)analytics\.google\.com$/, path: ANY_PATH },
  { host: /(^|\.)doubleclick\.net$/, path: ANY_PATH },
  { host: /(^|\.)googleadservices\.com$/, path: ANY_PATH },
  { host: /(^|\.)googlesyndication\.com$/, path: ANY_PATH },
  { host: /^(www|adservice)\.google\.[a-z.]+$/, path: GOOGLE_TAG_PATH },
  { host: /(^|\.)(facebook|instagram)\.com$/, path: PIXEL_PATH },
];

const MAX_DECODING_ROUNDS = 3;
const LINE_BREAK = /(\r?\n)/;

let isInstalled = false;

export const isAnalyticsEndpoint = (address: string): boolean => {
  try {
    const { hostname, pathname } = new URL(address, window.location.href);
    return ANALYTICS_ENDPOINTS.some(({ host, path }) => host.test(hostname) && path.test(pathname));
  } catch (error) {
    return false;
  }
};

const decodedOnce = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
};

const fullyDecoded = (text: string, roundsLeft = MAX_DECODING_ROUNDS): string => {
  const decoded = decodedOnce(text);
  return decoded === text || roundsLeft === 1 ? decoded : fullyDecoded(decoded, roundsLeft - 1);
};

const withoutPersonalData = (text: string): string => {
  const decoded = fullyDecoded(text);
  const redacted = withoutGiftToken(redactPii(decoded));
  return redacted === decoded ? text : redacted;
};

const redactedComponent = (component: string): string => {
  const decoded = decodedOnce(component.replace(/\+/g, ' '));
  const redacted = withoutPersonalData(decoded);
  return redacted === decoded ? component : encodeURIComponent(redacted);
};

const redactedParameter = (parameter: string): string => {
  const valueStart = parameter.indexOf('=') + 1;
  return valueStart === 0
    ? parameter
    : parameter.slice(0, valueStart) + redactedComponent(parameter.slice(valueStart));
};

const redactedQuery = (query: string): string => query.split('&').map(redactedParameter).join('&');

const redactedLines = (body: string): string => body.split(LINE_BREAK).map(redactedQuery).join('');

const redactedAddress = (address: string): string => {
  const queryStart = address.indexOf('?') + 1;
  return queryStart === 0
    ? address
    : address.slice(0, queryStart) + redactedQuery(address.slice(queryStart));
};

const redactedSearchParams = (params: URLSearchParams): URLSearchParams => {
  const redacted = new URLSearchParams();
  params.forEach((value, name) => redacted.append(name, withoutPersonalData(value)));
  return redacted;
};

const redactedFormData = (form: FormData): FormData => {
  const redacted = new FormData();
  form.forEach((value, name) =>
    redacted.append(name, typeof value === 'string' ? withoutPersonalData(value) : value),
  );
  return redacted;
};

const redactedBody = (body: Body): Body => {
  if (typeof body === 'string') {
    return redactedLines(body);
  }
  if (body instanceof URLSearchParams) {
    return redactedSearchParams(body);
  }
  if (body instanceof FormData) {
    return redactedFormData(body);
  }
  return body;
};

const readText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

const redactedBlob = (blob: Blob): Promise<Blob> =>
  readText(blob).then((text) => new Blob([redactedLines(text)], { type: blob.type }));

const safely = <T>(redacted: () => T, original: () => T): T => {
  try {
    return redacted();
  } catch (error) {
    return original();
  }
};

const addressOf = (input: RequestInfo | URL): string | null => {
  if (typeof input === 'string') {
    return input;
  }
  return input instanceof URL ? input.href : null;
};

const scrubbedFetch = (originalFetch: typeof window.fetch): typeof window.fetch =>
  function fetchWithoutPersonalData(...args: Parameters<typeof window.fetch>) {
    const [input, init] = args;
    const address = addressOf(input);
    if (address === null || !isAnalyticsEndpoint(address)) {
      return originalFetch.apply(window, args);
    }

    const sendOriginal = () => originalFetch.call(window, input, init);
    return safely(() => {
      const redactedInput = redactedAddress(address);
      const body = init?.body;
      if (body instanceof Blob) {
        return redactedBlob(body).then(
          (blob) => originalFetch.call(window, redactedInput, { ...init, body: blob }),
          sendOriginal,
        );
      }
      const redactedInit = init && { ...init, body: redactedBody(body) as BodyInit };
      return originalFetch.call(window, redactedInput, redactedInit);
    }, sendOriginal);
  };

const scrubbedSendBeacon = (originalSendBeacon: Navigator['sendBeacon']): Navigator['sendBeacon'] =>
  function sendBeaconWithoutPersonalData(...args: Parameters<Navigator['sendBeacon']>) {
    const [url, data] = args;
    const address = String(url);
    if (!isAnalyticsEndpoint(address)) {
      return originalSendBeacon.apply(navigator, args);
    }

    const sendOriginal = () => originalSendBeacon.call(navigator, url, data);
    return safely(() => {
      const redactedUrl = redactedAddress(address);
      if (data instanceof Blob) {
        redactedBlob(data).then(
          (blob) => originalSendBeacon.call(navigator, redactedUrl, blob),
          sendOriginal,
        );
        return true;
      }
      return originalSendBeacon.call(navigator, redactedUrl, redactedBody(data) as BodyInit);
    }, sendOriginal);
  };

const requestsToAnalytics = new WeakSet<XMLHttpRequest>();

type Open = (this: XMLHttpRequest, ...args: unknown[]) => void;
type Send = (this: XMLHttpRequest, body?: Body) => void;

const scrubbedOpen = (originalOpen: Open): Open =>
  function openWithoutPersonalData(this: XMLHttpRequest, ...args: unknown[]) {
    const [method, url, ...rest] = args;
    const address = String(url);
    if (!isAnalyticsEndpoint(address)) {
      requestsToAnalytics.delete(this);
      return originalOpen.apply(this, args);
    }

    requestsToAnalytics.add(this);
    return safely(
      () => originalOpen.call(this, method, redactedAddress(address), ...rest),
      () => originalOpen.apply(this, args),
    );
  };

const scrubbedSend = (originalSend: Send): Send =>
  function sendWithoutPersonalData(this: XMLHttpRequest, ...args: [Body?]) {
    const [body] = args;
    if (!requestsToAnalytics.has(this)) {
      return originalSend.apply(this, args);
    }

    const sendOriginal = () => originalSend.apply(this, args);
    return safely(() => {
      if (body instanceof Blob) {
        redactedBlob(body).then((blob) => originalSend.call(this, blob), sendOriginal);
        return undefined;
      }
      return originalSend.call(this, redactedBody(body));
    }, sendOriginal);
  };

const addressWithoutPersonalData = (address: string): string =>
  safely(
    () => (isAnalyticsEndpoint(address) ? redactedAddress(address) : address),
    () => address,
  );

const installImageScrubber = () => {
  const source = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const setSource = source?.set;
  if (!source || !setSource) {
    return;
  }
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...source,
    set(this: HTMLImageElement, address: string) {
      setSource.call(this, addressWithoutPersonalData(String(address)));
    },
  });
};

const redactField = (field: Element) => {
  const textField = field;
  if (textField instanceof HTMLInputElement || textField instanceof HTMLTextAreaElement) {
    textField.value = withoutPersonalData(textField.value);
  }
};

const redactFieldsOfAnalyticsForm = (form: HTMLFormElement) => {
  if (isAnalyticsEndpoint(form.action)) {
    Array.from(form.elements).forEach(redactField);
  }
};

const scrubbedSubmit = (originalSubmit: HTMLFormElement['submit']): HTMLFormElement['submit'] =>
  function submitWithoutPersonalData(this: HTMLFormElement) {
    safely(
      () => redactFieldsOfAnalyticsForm(this),
      () => undefined,
    );
    originalSubmit.call(this);
  };

export const installAnalyticsPiiScrubber = (): void => {
  if (isInstalled) {
    return;
  }
  isInstalled = true;

  if (typeof window.fetch === 'function') {
    window.fetch = scrubbedFetch(window.fetch);
  }
  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon = scrubbedSendBeacon(navigator.sendBeacon);
  }
  XMLHttpRequest.prototype.open = scrubbedOpen(XMLHttpRequest.prototype.open as Open);
  XMLHttpRequest.prototype.send = scrubbedSend(XMLHttpRequest.prototype.send as Send);
  HTMLFormElement.prototype.submit = scrubbedSubmit(HTMLFormElement.prototype.submit);
  installImageScrubber();
};
