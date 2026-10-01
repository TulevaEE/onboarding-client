import {
  ParameterFilter,
  redactPiiInAddress,
  redactPiiInQuery,
  redactPiiInText,
} from './piiInAddress';

interface Endpoint {
  host: RegExp;
  path: RegExp;
  isUserData: ParameterFilter;
}

type Body = BodyInit | Document | null | undefined;

const ANY_PATH = /^\//;
const GOOGLE_TAG_PATH = /^\/(pagead|ads|ccm|g|rmkt|measurement|travel\/flights\/click)\//;
const META_PIXEL_PATH = /^\/(tr\/?$|privacy_sandbox\/)/;
const GOOGLE_HOST_OF_A_COUNTRY =
  /^((www|adservice)\.)?google\.(com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/;

const GOOGLE_USER_DATA_PARAMETERS = ['em', 'emd', 'ecsid'];
const META_USER_DATA_PARAMETERS = /^((ud|udff|udwv|udai|aud|audff)\[|(cud|cudff)$)/;

const isGoogleUserData: ParameterFilter = (name) => GOOGLE_USER_DATA_PARAMETERS.includes(name);
const isMetaUserData: ParameterFilter = (name) => META_USER_DATA_PARAMETERS.test(name);

const ANALYTICS_ENDPOINTS: Endpoint[] = [
  { host: /(^|\.)google-analytics\.com$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)analytics\.google\.com$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)doubleclick\.net$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)googleadservices\.com$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)googlesyndication\.com$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)googletagmanager\.com$/, path: ANY_PATH, isUserData: isGoogleUserData },
  { host: GOOGLE_HOST_OF_A_COUNTRY, path: GOOGLE_TAG_PATH, isUserData: isGoogleUserData },
  { host: /(^|\.)(facebook|instagram)\.com$/, path: META_PIXEL_PATH, isUserData: isMetaUserData },
  { host: /(^|\.)facebook\.net$/, path: ANY_PATH, isUserData: isMetaUserData },
];

const LINE_BREAK = /(\r?\n)/;
const JSON_START = /^\s*[[{]/;

let isInstalled = false;

const analyticsEndpointOf = (address: string): Endpoint | null => {
  try {
    const { hostname, pathname } = new URL(address, window.location.href);
    return (
      ANALYTICS_ENDPOINTS.find(({ host, path }) => host.test(hostname) && path.test(pathname)) ??
      null
    );
  } catch (error) {
    return null;
  }
};

export const isAnalyticsEndpoint = (address: string): boolean =>
  analyticsEndpointOf(address) !== null;

const redactedJsonValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return redactPiiInText(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactedJsonValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce<Record<string, unknown>>(
      (redacted, key) => ({
        ...redacted,
        [key]: redactedJsonValue((value as Record<string, unknown>)[key]),
      }),
      {},
    );
  }
  return value;
};

const redactedJson = (body: string): string | null => {
  if (!JSON_START.test(body)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(body);
    const redacted = JSON.stringify(redactedJsonValue(parsed));
    return redacted === JSON.stringify(parsed) ? body : redacted;
  } catch (error) {
    return null;
  }
};

const redactedLines = (body: string, endpoint: Endpoint): string =>
  body
    .split(LINE_BREAK)
    .map((line) => redactPiiInQuery(line, endpoint.isUserData))
    .join('');

const redactedText = (body: string, endpoint: Endpoint): string =>
  redactedJson(body) ?? redactedLines(body, endpoint);

const redactedSearchParams = (params: URLSearchParams, endpoint: Endpoint): URLSearchParams => {
  const redacted = new URLSearchParams();
  params.forEach((value, name) => {
    if (!endpoint.isUserData(name)) {
      redacted.append(name, redactPiiInText(value));
    }
  });
  return redacted;
};

const redactedFormData = (form: FormData, endpoint: Endpoint): FormData => {
  const redacted = new FormData();
  form.forEach((value, name) => {
    if (!endpoint.isUserData(name)) {
      redacted.append(name, typeof value === 'string' ? redactPiiInText(value) : value);
    }
  });
  return redacted;
};

const redactedBody = (body: Body, endpoint: Endpoint): Body => {
  if (typeof body === 'string') {
    return redactedText(body, endpoint);
  }
  if (body instanceof URLSearchParams) {
    return redactedSearchParams(body, endpoint);
  }
  if (body instanceof FormData) {
    return redactedFormData(body, endpoint);
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

const redactedBlob = (blob: Blob, endpoint: Endpoint): Promise<Blob> =>
  readText(blob).then((text) => new Blob([redactedText(text, endpoint)], { type: blob.type }));

const safely = <T>(redacted: () => T, original: () => T): T => {
  try {
    return redacted();
  } catch (error) {
    return original();
  }
};

const isRequest = (input: unknown): input is Request =>
  typeof Request === 'function' && input instanceof Request;

const addressOf = (input: RequestInfo | URL): string | null => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return isRequest(input) ? input.url : null;
};

const METHODS_WITHOUT_BODY = ['GET', 'HEAD'];

const redactedRequest = async (request: Request, endpoint: Endpoint): Promise<Request> => {
  const hasBody = !METHODS_WITHOUT_BODY.includes(request.method.toUpperCase());
  const body = hasBody ? redactedText(await request.clone().text(), endpoint) : undefined;
  return new Request(redactPiiInAddress(request.url, endpoint.isUserData), {
    method: request.method,
    headers: request.headers,
    body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
    keepalive: request.keepalive,
    signal: request.signal,
  });
};

type FetchArguments = Parameters<typeof window.fetch>;

const redactedFetchArguments = async (
  [input, init]: FetchArguments,
  address: string,
  endpoint: Endpoint,
): Promise<FetchArguments> => {
  const redactedInput = isRequest(input)
    ? await redactedRequest(input, endpoint)
    : redactPiiInAddress(address, endpoint.isUserData);
  const body = init?.body;
  const redactedInitBody =
    body instanceof Blob ? await redactedBlob(body, endpoint) : redactedBody(body, endpoint);
  return [redactedInput, init && { ...init, body: redactedInitBody as BodyInit }];
};

const scrubbedFetch = (originalFetch: typeof window.fetch): typeof window.fetch =>
  function fetchWithoutPersonalData(...args: FetchArguments) {
    const [input, init] = args;
    const address = addressOf(input);
    const endpoint = address === null ? null : analyticsEndpointOf(address);
    if (address === null || endpoint === null) {
      return originalFetch.apply(window, args);
    }

    const sendOriginal = () => originalFetch.call(window, input, init);
    return safely(() => {
      const body = init?.body;
      const mustReadFirst = body instanceof Blob || isRequest(input);
      if (mustReadFirst) {
        return redactedFetchArguments(args, address, endpoint).then(
          (redactedArguments) => originalFetch.apply(window, redactedArguments),
          sendOriginal,
        );
      }
      return originalFetch.call(
        window,
        redactPiiInAddress(address, endpoint.isUserData),
        init && { ...init, body: redactedBody(body, endpoint) as BodyInit },
      );
    }, sendOriginal);
  };

const scrubbedSendBeacon = (originalSendBeacon: Navigator['sendBeacon']): Navigator['sendBeacon'] =>
  function sendBeaconWithoutPersonalData(...args: Parameters<Navigator['sendBeacon']>) {
    const [url, data] = args;
    const address = String(url);
    const endpoint = analyticsEndpointOf(address);
    if (endpoint === null) {
      return originalSendBeacon.apply(navigator, args);
    }

    const sendOriginal = () => originalSendBeacon.call(navigator, url, data);
    return safely(() => {
      const redactedUrl = redactPiiInAddress(address, endpoint.isUserData);
      if (data instanceof Blob) {
        redactedBlob(data, endpoint).then(
          (blob) => originalSendBeacon.call(navigator, redactedUrl, blob),
          sendOriginal,
        );
        return true;
      }
      return originalSendBeacon.call(
        navigator,
        redactedUrl,
        redactedBody(data, endpoint) as BodyInit,
      );
    }, sendOriginal);
  };

const endpointsOfRequests = new WeakMap<XMLHttpRequest, Endpoint>();

type Open = (this: XMLHttpRequest, ...args: unknown[]) => void;
type Send = (this: XMLHttpRequest, body?: Body) => void;

const scrubbedOpen = (originalOpen: Open): Open =>
  function openWithoutPersonalData(this: XMLHttpRequest, ...args: unknown[]) {
    const [method, url, ...rest] = args;
    const address = String(url);
    const endpoint = analyticsEndpointOf(address);
    if (endpoint === null) {
      endpointsOfRequests.delete(this);
      return originalOpen.apply(this, args);
    }

    endpointsOfRequests.set(this, endpoint);
    return safely(
      () =>
        originalOpen.call(this, method, redactPiiInAddress(address, endpoint.isUserData), ...rest),
      () => originalOpen.apply(this, args),
    );
  };

const scrubbedSend = (originalSend: Send): Send =>
  function sendWithoutPersonalData(this: XMLHttpRequest, ...args: [Body?]) {
    const [body] = args;
    const endpoint = endpointsOfRequests.get(this);
    if (endpoint === undefined) {
      return originalSend.apply(this, args);
    }

    const sendOriginal = () => originalSend.apply(this, args);
    return safely(() => {
      if (body instanceof Blob) {
        redactedBlob(body, endpoint).then((blob) => originalSend.call(this, blob), sendOriginal);
        return undefined;
      }
      return originalSend.call(this, redactedBody(body, endpoint));
    }, sendOriginal);
  };

const sourceWithoutPersonalData = (source: unknown): unknown =>
  safely(
    () => {
      const address = String(source);
      const endpoint = analyticsEndpointOf(address);
      if (endpoint === null) {
        return source;
      }
      const redacted = redactPiiInAddress(address, endpoint.isUserData);
      return redacted === address ? source : redacted;
    },
    () => source,
  );

const settingSourceWithoutPersonalData = (
  setSource: (source: unknown) => void,
  source: unknown,
) => {
  const redacted = sourceWithoutPersonalData(source);
  if (redacted === source) {
    setSource(source);
    return;
  }
  try {
    setSource(redacted);
  } catch (error) {
    setSource(source);
  }
};

const elementsThatLoadASource = (): Array<{ prototype: HTMLElement }> =>
  [
    typeof HTMLImageElement === 'function' ? HTMLImageElement : undefined,
    typeof HTMLScriptElement === 'function' ? HTMLScriptElement : undefined,
    typeof HTMLIFrameElement === 'function' ? HTMLIFrameElement : undefined,
  ].filter((element): element is NonNullable<typeof element> => element !== undefined);

// A browser that refuses one hook must neither break page start-up nor leave the other transports open.
const installEach = (hooks: Array<() => void>) =>
  hooks.forEach((hook) => {
    try {
      hook();
    } catch (error) {
      // keep installing the remaining hooks
    }
  });

const installSourceScrubber = (element: { prototype: HTMLElement }) => {
  const source = Object.getOwnPropertyDescriptor(element.prototype, 'src');
  const setSource = source?.set;
  if (!source || !setSource) {
    return;
  }
  Object.defineProperty(element.prototype, 'src', {
    ...source,
    set(this: HTMLElement, address: unknown) {
      settingSourceWithoutPersonalData((value) => setSource.call(this, value), address);
    },
  });
};

const loadsASource = (element: Element): boolean =>
  elementsThatLoadASource().some(({ prototype }) =>
    Object.prototype.isPrototypeOf.call(prototype, element),
  );

const isSourceAttribute = (name: unknown): boolean =>
  typeof name === 'string' && name.length === 3 && name.toLowerCase() === 'src';

const installSourceAttributeScrubber = () => {
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function setAttributeWithoutPersonalData(
    this: Element,
    ...args: Parameters<Element['setAttribute']>
  ) {
    const [name, value] = args;
    if (!isSourceAttribute(name) || !loadsASource(this)) {
      return originalSetAttribute.apply(this, args);
    }
    return settingSourceWithoutPersonalData(
      (source) => originalSetAttribute.call(this, name, source as string),
      value,
    );
  };
};

const redactField = (field: Element, endpoint: Endpoint) => {
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    return;
  }
  if (endpoint.isUserData(field.name)) {
    field.remove();
    return;
  }
  const textField = field;
  textField.value = redactPiiInText(textField.value);
};

const redactFieldsOfAnalyticsForm = (form: HTMLFormElement) => {
  const endpoint = analyticsEndpointOf(form.action);
  if (endpoint !== null) {
    Array.from(form.elements).forEach((field) => redactField(field, endpoint));
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

  installEach([
    () => {
      if (typeof window.fetch === 'function') {
        window.fetch = scrubbedFetch(window.fetch);
      }
    },
    () => {
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon = scrubbedSendBeacon(navigator.sendBeacon);
      }
    },
    () => {
      XMLHttpRequest.prototype.open = scrubbedOpen(XMLHttpRequest.prototype.open as Open);
    },
    () => {
      XMLHttpRequest.prototype.send = scrubbedSend(XMLHttpRequest.prototype.send as Send);
    },
    () => {
      HTMLFormElement.prototype.submit = scrubbedSubmit(HTMLFormElement.prototype.submit);
    },
    ...elementsThatLoadASource().map((element) => () => installSourceScrubber(element)),
    installSourceAttributeScrubber,
  ]);
};
