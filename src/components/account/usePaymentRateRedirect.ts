import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { postPaymentRateRedirect } from '../common/api';

type LandingState = { justLoggedIn?: boolean } | undefined;

export function usePaymentRateRedirect(): void {
  const history = useHistory();
  const { pathname, search, state } = useLocation<LandingState>();
  const justLoggedIn = state?.justLoggedIn === true;
  const onTheAccountPage = useRef(true);

  useEffect(() => {
    onTheAccountPage.current = true;
    return () => {
      onTheAccountPage.current = false;
    };
  }, []);

  useEffect(() => {
    const stillOnTheLanding =
      history.location.pathname === pathname &&
      (history.location.state as LandingState)?.justLoggedIn === true;
    if (!justLoggedIn || !stillOnTheLanding) {
      return;
    }
    history.replace({ pathname, search });
    postPaymentRateRedirect()
      .then(({ redirect, arm, seasonYear }) => {
        if (redirect && onTheAccountPage.current) {
          history.replace('/2nd-pillar-payment-rate', { nudge: { arm, seasonYear } });
        }
      })
      .catch(() => {});
  }, [justLoggedIn]);
}
