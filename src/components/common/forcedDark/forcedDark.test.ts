import { CANVAS_COLOR_OF_A_LIGHT_PAGE, isForcedDark, markForcedDark } from './forcedDark';

const browserPaintsTheCanvasColorAs = (backgroundColor: string) => {
  const realGetComputedStyle = window.getComputedStyle;
  jest
    .spyOn(window, 'getComputedStyle')
    .mockImplementation((element, pseudoElement) =>
      element.getAttribute('style') === CANVAS_COLOR_OF_A_LIGHT_PAGE
        ? ({ backgroundColor } as CSSStyleDeclaration)
        : realGetComputedStyle(element, pseudoElement),
    );
};

describe('forced dark', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.documentElement.classList.remove('forced-dark');
  });

  it('marks the page forced dark when the browser paints the canvas of a light page dark', () => {
    browserPaintsTheCanvasColorAs('rgb(18, 18, 18)');

    markForcedDark();

    expect(document.documentElement).toHaveClass('forced-dark');
    expect(isForcedDark()).toBe(true);
  });

  it('leaves a page the browser paints light unmarked', () => {
    browserPaintsTheCanvasColorAs('rgb(255, 255, 255)');

    markForcedDark();

    expect(document.documentElement).not.toHaveClass('forced-dark');
    expect(isForcedDark()).toBe(false);
  });

  it.each(['rgba(0, 0, 0, 0)', 'canvas', ''])(
    'leaves the page unmarked when the browser cannot name its canvas color (%p), so a light page never gets dark-page colors',
    (backgroundColor) => {
      browserPaintsTheCanvasColorAs(backgroundColor);

      markForcedDark();

      expect(isForcedDark()).toBe(false);
    },
  );

  it('leaves no probe behind in the page', () => {
    const elementsBefore = document.body.childElementCount;

    markForcedDark();

    expect(document.body.childElementCount).toBe(elementsBefore);
  });
});
