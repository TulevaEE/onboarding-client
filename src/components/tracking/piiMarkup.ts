export const PII_CLASS = 'pii';

const WIDGET_OWNED_PII = ['.in-ads-popup', '#maaAmetAddressComponent_popup'];

const PII_SELECTOR = [`.${PII_CLASS}`, ...WIDGET_OWNED_PII].join(', ');

export const isInsidePii = (element: Element): boolean => element.closest(PII_SELECTOR) !== null;

export const holdsPii = (element: Element): boolean => element.querySelector(PII_SELECTOR) !== null;
