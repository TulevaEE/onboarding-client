import { PaymentRateRedirect } from '../../apiModels/nudge';

export const paymentRateRedirectProfiles: Record<string, PaymentRateRedirect> = {
  TREATMENT: { redirect: true, arm: 'TREATMENT', seasonYear: 2026 },
  NO_REDIRECT: { redirect: false },
};
