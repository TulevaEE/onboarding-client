import { mandateDeadlinesResponse } from '../../../../test/backend-responses';
import { MandateDeadlines } from '../../apiModels';

export const mandateDeadlinesProfiles: Record<string, MandateDeadlines> = {
  NOVEMBER_2026_BEFORE_DEADLINE: {
    ...mandateDeadlinesResponse,
    periodEnding: '2026-11-30T21:59:59.999999999Z',
    transferMandateCancellationDeadline: '2026-11-30T21:59:59.999999999Z',
    transferMandateFulfillmentDate: '2027-01-01',
    paymentRateDeadline: '2026-11-30T21:59:59.999999999Z',
    paymentRateFulfillmentDate: '2027-01-01',
    thirdPillarPaymentDeadline: '2026-12-28T13:59:59.999999999Z',
  },
  DECEMBER_2026_AFTER_DEADLINE: {
    ...mandateDeadlinesResponse,
    periodEnding: '2027-03-31T20:59:59.999999999Z',
    transferMandateCancellationDeadline: '2027-03-31T20:59:59.999999999Z',
    transferMandateFulfillmentDate: '2027-05-01',
    paymentRateDeadline: '2027-11-30T21:59:59.999999999Z',
    paymentRateFulfillmentDate: '2028-01-01',
    thirdPillarPaymentDeadline: '2026-12-28T13:59:59.999999999Z',
  },
};
