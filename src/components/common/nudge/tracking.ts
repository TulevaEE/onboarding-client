import { createTrackedEvent, createTrackedEventBeforeUnload } from '../api';

export type NudgeEventType = 'NUDGE_VIEW' | 'NUDGE_CLICK';

export const trackNudgeEvent = (
  type: NudgeEventType,
  data: Record<string, unknown>,
): Promise<unknown> =>
  (type === 'NUDGE_CLICK'
    ? createTrackedEventBeforeUnload(type, data)
    : createTrackedEvent(type, data)
  ).catch(() => {});
