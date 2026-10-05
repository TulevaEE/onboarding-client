export type DeviceClass = 'phone' | 'tablet' | 'computer';

const PHONE_USER_AGENTS = /iPhone|iPod|Android.*Mobile/i;
const TABLET_USER_AGENTS = /iPad|Android/i;
const DESKTOP_CLASS_TABLET_USER_AGENTS = /Macintosh/i;

export function deviceClass(): DeviceClass {
  const { userAgent, maxTouchPoints } = navigator;

  if (PHONE_USER_AGENTS.test(userAgent)) {
    return 'phone';
  }
  if (
    TABLET_USER_AGENTS.test(userAgent) ||
    (DESKTOP_CLASS_TABLET_USER_AGENTS.test(userAgent) && maxTouchPoints > 1)
  ) {
    return 'tablet';
  }
  return 'computer';
}
