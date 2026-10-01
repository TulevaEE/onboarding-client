import { holdsPii, isInsidePii } from './piiMarkup';
import { containsPii } from './piiPatterns';
import { isGiftPage, withoutGiftToken } from './giftPage';

type Listener = [EventTarget, string, (event: Event) => void, boolean];

const PII_PLACEHOLDER = '[pii]';
const LINK_SELECTOR = 'a, area';
const META_BUTTON_SELECTORS = [
  'input[type="button"]',
  'input[type="image"]',
  'input[type="submit"]',
  'button',
  '[class*="btn"]',
  '[class*="Btn"]',
  '[class*="submit"]',
  '[class*="Submit"]',
  '[class*="button"]',
  '[class*="Button"]',
  '[role*="button"]',
  '[href^="tel:"]',
  '[href^="callto:"]',
  '[href^="mailto:"]',
  '[href^="sms:"]',
  '[href^="skype:"]',
  '[href^="whatsapp:"]',
  '[id*="btn"]',
  '[id*="Btn"]',
  '[id*="button"]',
  '[id*="Button"]',
  'a',
];
const TAG_MANAGER_LINK_SELECTORS = ['a', 'area'];
const CLICKABLE_SELECTOR = [...META_BUTTON_SELECTORS, ...TAG_MANAGER_LINK_SELECTORS].join(', ');
const CLICK_EVENTS = ['click', 'auxclick'];
const KEPT_ATTRIBUTES = ['id', 'class', 'role', 'type', 'name', 'target', 'rel'];
const QUERY_AND_HASH = /[?#].*$/;

let isInstalled = false;

const textOf = (element: Element): string =>
  ((element as HTMLElement).innerText || element.textContent || '').replace(/\s+/g, ' ');

const isPersonal = (element: Element): boolean =>
  isInsidePii(element) || holdsPii(element) || containsPii(textOf(element));

const standIn = (element: Element, href: string | null, text = PII_PLACEHOLDER): Element => {
  const substitute = document.createElementNS(element.namespaceURI, element.localName);
  KEPT_ATTRIBUTES.forEach((name) => {
    const value = element.getAttribute(name);
    if (value !== null) {
      substitute.setAttribute(name, value);
    }
  });
  if (href !== null) {
    substitute.setAttribute('href', href);
  }
  substitute.textContent = text;
  return substitute;
};

const reportedAddress = (href: string | null): string | null =>
  href === null ? null : withoutGiftToken(href.replace(QUERY_AND_HASH, ''));

const restoreTarget = (event: Event) => {
  Reflect.deleteProperty(event, 'target');
};

const showListenersInstead = (event: Event, substitute: Element) => {
  Object.defineProperty(event, 'target', { configurable: true, get: () => substitute });
  window.setTimeout(() => restoreTarget(event));
};

const clickedElement = (event: Event): Element | null =>
  event.target instanceof Element ? event.target : null;

const clickableAncestorsOf = (element: Element): Element[] => {
  const clickable = element.closest(CLICKABLE_SELECTOR);
  if (clickable === null) {
    return [];
  }
  const outer = clickable.parentElement;
  return [clickable, ...(outer ? clickableAncestorsOf(outer) : [])];
};

const isInsidePersonalClickable = (element: Element): boolean =>
  clickableAncestorsOf(element).some(isPersonal);

const maskForClickListeners = (event: Event) => {
  const element = clickedElement(event);
  if (!element) {
    return;
  }
  const address = reportedAddress(element.getAttribute('href'));
  if (isPersonal(element)) {
    showListenersInstead(event, standIn(element, address));
  } else if (isInsidePersonalClickable(element)) {
    showListenersInstead(event, standIn(element, address, textOf(element)));
  }
};

const maskForLinkListeners = (event: Event) => {
  const link = clickedElement(event)?.closest(LINK_SELECTOR);
  if (link && isPersonal(link)) {
    showListenersInstead(event, standIn(link, link.getAttribute('href')));
  }
};

const guardListeners = (): Listener[] =>
  CLICK_EVENTS.reduce<Listener[]>(
    (listeners, type) => [
      ...listeners,
      [window, type, maskForClickListeners, true],
      [document.documentElement, type, restoreTarget, true],
      [document.documentElement, type, maskForLinkListeners, false],
      [window, type, restoreTarget, false],
    ],
    [],
  );

export const installPiiClickGuard = (): (() => void) => {
  if (isInstalled || isGiftPage()) {
    return () => {};
  }
  isInstalled = true;

  const listeners = guardListeners();
  listeners.forEach(([target, type, listener, useCapture]) =>
    target.addEventListener(type, listener, useCapture),
  );
  return () => {
    listeners.forEach(([target, type, listener, useCapture]) =>
      target.removeEventListener(type, listener, useCapture),
    );
    isInstalled = false;
  };
};
