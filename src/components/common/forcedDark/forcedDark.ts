const OPAQUE_RGB = /^rgba?\((\d+), (\d+), (\d+)(?:, (1|0?\.\d+))?\)$/;
const DARKER_THAN_MID_GRAY = 128;
export const CANVAS_COLOR_OF_A_LIGHT_PAGE =
  'display: none; color-scheme: light; background-color: canvas';

const isOpaqueAndDark = (color: string) => {
  const [, red, green, blue, alpha = '1'] = color.match(OPAQUE_RGB) ?? [];
  if (red === undefined || Number(alpha) < 1) {
    return false;
  }
  return (Number(red) + Number(green) + Number(blue)) / 3 < DARKER_THAN_MID_GRAY;
};

// Chromium's auto dark mode (Brave's forced dark) paints the canvas system color dark even under color-scheme: light.
const browserForcesDarkMode = (): boolean => {
  const probe = document.createElement('div');
  probe.setAttribute('style', CANVAS_COLOR_OF_A_LIGHT_PAGE);
  document.body.append(probe);
  const canvasColor = window.getComputedStyle(probe).backgroundColor;
  probe.remove();
  return isOpaqueAndDark(canvasColor);
};

const FORCED_DARK_CLASS = 'forced-dark';

export const markForcedDark = (): void => {
  document.documentElement.classList.toggle(FORCED_DARK_CLASS, browserForcesDarkMode());
};

export const isForcedDark = (): boolean =>
  document.documentElement.classList.contains(FORCED_DARK_CLASS);
