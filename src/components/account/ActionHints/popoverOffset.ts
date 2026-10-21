const SCREEN_MARGIN = 16;

type Placement = {
  triggerLeft: number;
  triggerRight: number;
  popoverWidth: number;
  viewportWidth: number;
};

export const popoverOffset = ({
  triggerLeft,
  triggerRight,
  popoverWidth,
  viewportWidth,
}: Placement): number => {
  const isTriggerOnRightHalf = (triggerLeft + triggerRight) / 2 > viewportWidth / 2;
  const preferredLeft = isTriggerOnRightHalf ? triggerRight - popoverWidth : triggerLeft;
  const rightmostLeft = viewportWidth - SCREEN_MARGIN - popoverWidth;
  const left = Math.max(SCREEN_MARGIN, Math.min(preferredLeft, rightmostLeft));
  return left - triggerLeft;
};
