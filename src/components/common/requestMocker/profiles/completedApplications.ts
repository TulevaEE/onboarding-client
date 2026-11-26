import { Application } from '../../apiModels';

const withdrawalFiledInFebruary2023: Application = {
  id: 9101,
  status: 'COMPLETE',
  creationTime: '2023-02-14T09:30:00Z',
  type: 'EARLY_WITHDRAWAL',
  details: {
    depositAccountIBAN: 'EE000000000000000000',
    cancellationDeadline: '2023-03-31T20:59:59Z',
    fulfillmentDate: '2023-09-01',
  },
};

const paymentRateRaiseToSixRealisedInDecember2026: Application = {
  id: 9102,
  status: 'COMPLETE',
  creationTime: '2026-11-10T10:00:00Z',
  type: 'PAYMENT_RATE',
  details: {
    paymentRate: 6,
    cancellationDeadline: '2026-11-30T21:59:59.999999999Z',
    fulfillmentDate: '2027-01-01',
  },
};

export const completedApplicationsProfiles = {
  NONE: [] as Application[],
  SECOND_PILLAR_WITHDRAWAL_FEBRUARY_2023: [withdrawalFiledInFebruary2023],
  SECOND_PILLAR_PAYMENT_RATE_RAISE_TO_6_REALISED: [paymentRateRaiseToSixRealisedInDecember2026],
};
