import { postWithAuthentication } from '../../common/http';
import { getEndpoint } from '../../common/api';
import { PaymentRate, SecondPillarPaymentRateChangeMandate } from './types';

import { UpdatableAuthenticationPrincipal } from '../../common/updatableAuthenticationPrincipal';

export function createSecondPillarPaymentRateChange(
  paymentRate: PaymentRate,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<SecondPillarPaymentRateChangeMandate> {
  return postWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/second-pillar-payment-rates`),
    { paymentRate },
  );
}
