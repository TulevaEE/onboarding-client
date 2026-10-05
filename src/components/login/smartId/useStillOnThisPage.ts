import { useEffect, useState } from 'react';

import { pageInView } from './pageInView';

const MILLIS_FOR_THE_SMART_ID_APP_TO_TAKE_OVER = 2000;

export function useStillOnThisPage(): boolean {
  const [stillOnThisPage, setStillOnThisPage] = useState(false);

  useEffect(() => {
    const showWhenInView = () => {
      if (pageInView()) {
        setStillOnThisPage(true);
      }
    };
    const appTakeOver = setTimeout(showWhenInView, MILLIS_FOR_THE_SMART_ID_APP_TO_TAKE_OVER);
    const onVisibilityChange = () => {
      clearTimeout(appTakeOver);
      showWhenInView();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(appTakeOver);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return stillOnThisPage;
}
