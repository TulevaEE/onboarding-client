import { Application, ApplicationStatus, ApplicationType } from './api';

export function usePendingApplications(): Application[] {
  return [
    {
      id: 123,
      type: ApplicationType.EARLY_WITHDRAWAL,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      details: {
        withdrawalTime: new Date('December 17, 1995 03:24:00').toISOString(),
        depositAccountIBAN: 'EE123123123',
      },
    },
    {
      id: 1234,
      type: ApplicationType.EXCHANGE,
      status: ApplicationStatus.PENDING,
      creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
      details: {
        sourceFund: {
          fundManager: { id: 5, name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva Maailma Aktsiate Pensionifond',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0042,
        },
        exchanges: [
          {
            targetFund: {
              fundManager: { id: 5, name: 'Tuleva' },
              isin: 'EE3600109443',
              name: 'Tuleva Maailma Võlakirjade Pensionifond',
              managementFeeRate: 0.0034,
              pillar: 2,
              ongoingChargesFigure: 0.0046,
            },
            amount: 0.01,
          },
        ],
      },
    },
  ];
}
