export const PII_CLASS = 'pii';

const PII_SELECTOR = `.${PII_CLASS}`;

export const isInsidePii = (element: Element): boolean => element.closest(PII_SELECTOR) !== null;

export const holdsPii = (element: Element): boolean => element.querySelector(PII_SELECTOR) !== null;
