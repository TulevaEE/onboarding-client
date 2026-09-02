const MOBILE_USER_AGENTS = /Android|iPhone|iPad|iPod/i;

export function isMobileDevice(): boolean {
  return MOBILE_USER_AGENTS.test(navigator.userAgent);
}
