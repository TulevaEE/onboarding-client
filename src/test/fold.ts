const LAPTOP_VIEWPORT_HEIGHT = 657;
const JSDOM_VIEWPORT_HEIGHT = 768;

export const setViewportHeight = (height: number): void => {
  window.innerHeight = height;
};

export const watchScrollingIntoView = (): jest.Mock => {
  const scrollIntoView = jest.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  return scrollIntoView;
};

export const layOutEverythingEndingAt = (bottom: number): void => {
  setViewportHeight(LAPTOP_VIEWPORT_HEIGHT);
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ bottom } as DOMRect);
};

export const layOutBelowTheFold = (): void =>
  layOutEverythingEndingAt(LAPTOP_VIEWPORT_HEIGHT + 200);

export const layOutAboveTheFold = (): void =>
  layOutEverythingEndingAt(LAPTOP_VIEWPORT_HEIGHT - 100);

export const forgetTheLayout = (): void => {
  jest.restoreAllMocks();
  setViewportHeight(JSDOM_VIEWPORT_HEIGHT);
};

export const scrolledIntoView = (scrollIntoView: jest.Mock): HTMLElement[] =>
  scrollIntoView.mock.instances as HTMLElement[];
