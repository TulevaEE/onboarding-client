import { createTrackedEvent } from '../../../common/api';

export const trackStandingOrderClick = (
  path: string,
  target: string,
  data: Record<string, unknown>,
): void => {
  createTrackedEvent('CLICK', { ...data, path, target }).catch(() => {});
};
