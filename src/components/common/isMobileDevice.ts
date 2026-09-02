const MOBILE_USER_AGENTS = /Android|iPhone|iPad|iPod/i;
const DESKTOP_CLASS_TABLET_USER_AGENTS = /Macintosh/i;

export function isMobileDevice(): boolean {
  const { userAgent, maxTouchPoints } = navigator;

  return (
    MOBILE_USER_AGENTS.test(userAgent) ||
    (DESKTOP_CLASS_TABLET_USER_AGENTS.test(userAgent) && maxTouchPoints > 1)
  );
}
