import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { postPaymentRateRedirect } from '../common/api';

type LandingState = { justLoggedIn?: boolean } | undefined;

export function usePaymentRateRedirect(): void {
  const history = useHistory();
  const { pathname, state } = useLocation<LandingState>();
  const justLoggedIn = state?.justLoggedIn === true;

  useEffect(() => {
    if (!justLoggedIn) {
      return;
    }
    history.replace(pathname);
    postPaymentRateRedirect()
      .then(({ redirect, arm, seasonYear }) => {
        if (redirect) {
          history.replace('/2nd-pillar-payment-rate', { nudge: { arm, seasonYear } });
        }
      })
      .catch(() => {});
  }, [justLoggedIn]);
}
