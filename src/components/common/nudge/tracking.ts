import { createTrackedEvent } from '../api';

export type NudgeEventType = 'NUDGE_VIEW' | 'NUDGE_CLICK';

export const trackNudgeEvent = (
  type: NudgeEventType,
  data: Record<string, unknown>,
): Promise<unknown> => createTrackedEvent(type, data).catch(() => {});
