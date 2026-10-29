import { useEffect, useState } from 'react';

const TOUCH_VIEW = '(pointer: coarse) and (max-width: 1199.98px)';

export const useTouchView = () => {
  const [isTouchView, setTouchView] = useState(() => window.matchMedia(TOUCH_VIEW).matches);
  useEffect(() => {
    const query = window.matchMedia(TOUCH_VIEW);
    const update = () => setTouchView(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return isTouchView;
};
