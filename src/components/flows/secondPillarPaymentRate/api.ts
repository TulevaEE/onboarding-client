import { postWithAuthentication } from '../../common/http';
import { getEndpoint } from '../../common/api';
import { PaymentRate, SecondPillarPaymentRateChangeMandate } from './types';

export function createSecondPillarPaymentRateChange(
  paymentRate: PaymentRate,
): Promise<SecondPillarPaymentRateChangeMandate> {
  return postWithAuthentication(getEndpoint(`/v1/second-pillar-payment-rates`), { paymentRate });
}
