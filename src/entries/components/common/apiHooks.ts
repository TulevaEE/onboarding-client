import { useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';

import {
  Application,
  TransferApplication,
  ApplicationType,
  getPendingApplications,
  getFunds,
  Fund,
  BaseApplication,
} from './api';

function useToken(): string | null {
  return useSelector<{ login: { token?: string } }, string | null>(
    (state) => state.login.token || null,
  );
}

export function useFunds(): UseQueryResult<Fund[]> {
  const token = useToken();
  return useQuery('funds', () => getFunds(token!));
}

export function usePendingApplications(): EnrichedApplication[] {
  const token = useToken();
  const fundResult = useFunds();
  const applicationResult = useQuery('pendingApplications', () => getPendingApplications(token!));

  if (applicationResult.data && fundResult.data) {
    return combineApplicationsAndFunds(applicationResult.data, fundResult.data);
  }
  return [];
}

function combineApplicationsAndFunds(
  applications: Application[],
  funds: Fund[],
): EnrichedApplication[] {
  return applications.map((application) => {
    if (application.type === ApplicationType.TRANSFER) {
      return {
        ...application,
        details: {
          ...application.details,
          sourceFund: funds.find((fund) => fund.isin === application.details.sourceFund)!,
          exchanges: application.details.exchanges.map((exchange) => ({
            ...exchange,
            targetFund: funds.find((fund) => fund.isin === exchange.targetFund)!,
          })),
        },
      };
    }
    return application;
  });
}

export type EnrichedApplication =
  | Exclude<Application, TransferApplication>
  | EnrichedTransferApplication;

export type EnrichedTransferApplication = BaseApplication<
  ApplicationType.TRANSFER,
  {
    sourceFund: Fund;
    exchanges: {
      targetFund: Fund;
      amount: number;
    }[];
  }
>;

/*
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
          {
            targetFund: {
              fundManager: { id: 5, name: 'Tuleva' },
              isin: 'EE3600109442',
              name: 'Tuleva GME Pensionifond 💎🙌',
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
  */
