export const SECOND_PILLAR_NUDGE_OTHER_SERVICE_ENTRY_KEY = 'secondPillarNudge.otherServiceEntry';
export const SECOND_PILLAR_NUDGE_DISMISSED_KEY = 'secondPillarNudge.dismissed';

const OTHER_SERVICE_PATH_PREFIXES = ['/3rd-pillar', '/savings-fund', '/withdrawals', '/partner'];

export function isOtherServiceDestination(pathname: string): boolean {
  return OTHER_SERVICE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function rememberOtherServiceEntry(): void {
  sessionStorage.setItem(SECOND_PILLAR_NUDGE_OTHER_SERVICE_ENTRY_KEY, 'true');
}

export function hasOtherServiceEntry(): boolean {
  return sessionStorage.getItem(SECOND_PILLAR_NUDGE_OTHER_SERVICE_ENTRY_KEY) === 'true';
}

export function rememberNudgeDismissed(): void {
  sessionStorage.setItem(SECOND_PILLAR_NUDGE_DISMISSED_KEY, 'true');
}

export function hasNudgeBeenDismissed(): boolean {
  return sessionStorage.getItem(SECOND_PILLAR_NUDGE_DISMISSED_KEY) === 'true';
}
