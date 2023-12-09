import { post } from '../../common/http';
import { getEndpoint } from '../../common/api';
import { PaymentRate, SecondPillarPaymentRateChangeMandate } from './types';

export function createSecondPillarPaymentRateChange(
  paymentRate: PaymentRate,
  token: string,
): Promise<SecondPillarPaymentRateChangeMandate> {
  return post(
    getEndpoint(`/v1/second-pillar-payment-rates`),
    { paymentRate },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}
